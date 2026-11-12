// @vitest-environment jsdom
/**
 * Smoke test for the Scene: mount it in local mode against the example campaign with one clock
 * and one index card on the surface, and make sure nothing throws and both items render.
 * Same shims and mocking approach as src/app.smoke.test.tsx.
 */
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { SWEEP_EVENT } from '../../ui/events';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../sync/firebase-config', () => ({ firebaseConfig: null }));

import example from '../../ledger/ledger.example.v1.json';
import { exportLedger, importLedger } from '../../ledger/normalize';
import type { SceneCard, SceneClock } from '../../ledger/types';
import { createStore } from '../../sync';
import { LedgerContext, makeLedgerApi } from '../../ui/context';
import { SceneView } from './index';

beforeAll(() => {
  // jsdom lacks these browser APIs the view uses
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO;
  if (!window.matchMedia) {
    window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, media: '', dispatchEvent: () => false });
  }
  if (!('PointerEvent' in window)) (window as unknown as { PointerEvent: unknown }).PointerEvent = MouseEvent;
  Element.prototype.scrollIntoView = () => {};
});

const CLOCK: SceneClock = { id: 's_clock1', kind: 'clock', x: 110, y: 70, createdAt: 1, name: 'Bluecoat patrol', size: 6, filled: 3 };
const CARD: SceneCard = {
  id: 's_card1',
  kind: 'card',
  x: 440,
  y: 440,
  createdAt: 2,
  type: 'npc',
  title: 'Mylera Klev',
  body: 'Red Sashes leader. On the balcony, sword across her knees.',
};

const PRIVATE: SceneCard = { ...CARD, id: 's_private', title: 'Secret reminder', gmOnly: true };

function mountScene(role: 'gm' | 'player' = 'gm', withPrivate = false) {
  const ledger = importLedger(JSON.stringify(example))!;
  ledger.scene = { items: { [CLOCK.id]: CLOCK, [CARD.id]: CARD, ...(withPrivate ? { [PRIVATE.id]: PRIVATE } : {}) } };
  const store = createStore('smoketestscene00001');
  store.replace(ledger);
  const errors: unknown[] = [];
  const onError = (e: ErrorEvent) => errors.push(e.error ?? e.message);
  window.addEventListener('error', onError);
  const host = document.createElement('div');
  document.body.appendChild(host);
  const api = makeLedgerApi({
    ledger: store.current()!,
    store,
    status: { state: 'saved', live: false, mode: 'local' },
    rolls: [],
    update: (p) => store.update(p),
    replace: (l) => store.replace(l),
    role,
    pushRoll: () => {},
    clearRolls: () => {},
  });
  const redraw = () => render(
    <LedgerContext.Provider value={{ ...api, ledger: store.current()! }}>
      <SceneView />
    </LedgerContext.Provider>,
    host,
  );
  redraw();
  const unsub = store.subscribe(redraw);
  window.removeEventListener('error', onError);
  return { host, errors, store, unmount: () => { unsub(); render(null, host); store.close(); host.remove(); } };
}

describe('Scene view mounts against a ledger with one clock and one card', () => {
  it('renders the clock name, the count and the card title without errors', () => {
    const { host, errors, unmount } = mountScene();
    expect(errors).toEqual([]);
    expect(host.querySelector('.scene')).not.toBeNull();
    expect(host.querySelectorAll('[data-scene-id]').length).toBe(2);

    const text = host.textContent ?? '';
    expect(text).toContain('Bluecoat patrol');
    expect(text).toContain('3 / 6');

    const title = host.querySelector<HTMLInputElement>('input.scene-card-title');
    expect(title?.value).toBe('Mylera Klev');
    const body = host.querySelector<HTMLTextAreaElement>('textarea.scene-card-body');
    expect(body?.value).toContain('Red Sashes leader');
    expect(host.querySelector('.scene-card-type')?.textContent).toBe('♟');
    unmount();
  });
});


describe('GM-only scene cards', () => {
  it('preserves visibility across export and import', () => {
    const ledger = importLedger(JSON.stringify(example))!;
    ledger.scene.items = { [PRIVATE.id]: PRIVATE, [CARD.id]: CARD };
    const restored = importLedger(JSON.stringify(exportLedger(ledger)))!;
    expect(restored.scene.items[PRIVATE.id]).toMatchObject({ gmOnly: true });
    expect(restored.scene.items[CARD.id]).not.toHaveProperty('gmOnly');
  });

  it('shows a labelled private card to the GM and lets them reveal it', async () => {
    const { host, store, unmount } = mountScene('gm', true);
    expect(host.querySelector('.scene-card-gm')?.textContent).toContain('GM ONLY');
    const card = host.querySelector('[data-scene-id="s_private"]')!;
    await act(() => void card.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })));
    expect(host.querySelector('[title="TO NETWORK"]')).toBeNull();
    await act(() => (host.querySelector('[title="SHOW PLAYERS"]') as HTMLElement).click());
    expect(store.current()!.scene.items[PRIVATE.id]).not.toMatchObject({ gmOnly: true });
    expect(host.querySelector('.scene-card-gm')).toBeNull();
    unmount();
  });

  it('excludes private cards from the player DOM and preserves them during player sweep', async () => {
    const { host, store, unmount } = mountScene('player', true);
    expect(host.querySelector('[data-scene-id="s_private"]')).toBeNull();
    await act(() => void host.querySelector('.scene-world')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })));
    expect(host.querySelector('[title="GM CARD"]')).toBeNull();
    await act(() => void window.dispatchEvent(new CustomEvent(SWEEP_EVENT)));
    await act(() => void window.dispatchEvent(new CustomEvent(SWEEP_EVENT)));
    expect(Object.keys(store.current()!.scene.items)).toEqual([PRIVATE.id]);
    unmount();
  });

  it('creates a GM card privately from the outset', async () => {
    const { host, store, unmount } = mountScene('gm');
    await act(() => void host.querySelector('.scene-world')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true })));
    await act(() => (host.querySelector('[title="GM CARD"]') as HTMLElement).click());
    const added = Object.values(store.current()!.scene.items).find(it => it.id !== CARD.id && it.id !== CLOCK.id);
    expect(added).toMatchObject({ kind: 'card', gmOnly: true });
    expect(host.querySelector('.scene-card-gm')).not.toBeNull();
    unmount();
  });
});
