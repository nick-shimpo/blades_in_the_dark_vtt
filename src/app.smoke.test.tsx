// @vitest-environment jsdom
/**
 * Smoke test: mount every view against the example campaign in local mode and make sure
 * nothing throws and the expected landmarks render. Catches runtime errors that the type
 * checker cannot (undefined data paths, bad hooks), before they reach the table.
 */
import { render, type JSX } from 'preact';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('./sync/firebase-config', () => ({ firebaseConfig: null }));

import example from './ledger/ledger.example.v1.json';
import { importLedger } from './ledger/normalize';
import { LedgerContext, makeLedgerApi } from './ui/context';
import { createStore } from './sync';
import { TableView } from './views/table';
import { SheetsView } from './views/sheets';
import { SparksView } from './views/sparks';
import { PlayView } from './views/play';

beforeAll(() => {
  // jsdom lacks these browser APIs the views use
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
  const svgProto = SVGElement.prototype as unknown as { getBBox?: () => DOMRect };
  if (!svgProto.getBBox) svgProto.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 }) as DOMRect;
});

function mountWith(View: () => JSX.Element, role: 'gm' | 'player' = 'gm') {
  const ledger = importLedger(JSON.stringify(example))!;
  const store = createStore('smoketestcampaign0001');
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
    role,
    update: (p) => store.update(p),
    replace: (l) => store.replace(l),
    pushRoll: () => {},
  });
  render(
    <LedgerContext.Provider value={api}>
      <View />
    </LedgerContext.Provider>,
    host,
  );
  window.removeEventListener('error', onError);
  return { host, errors, store, unmount: () => render(null, host) };
}

describe('views mount against the example ledger', () => {
  it('Table renders the crew card, the faction and the npc', () => {
    const { host, errors, unmount } = mountWith(TableView);
    expect(errors).toEqual([]);
    const text = host.textContent ?? '';
    expect(text).toContain("The Widow's Lantern");
    expect(text).toContain('The Red Sashes');
    expect(text).toContain('Bazso Baz');
    expect(text).toContain('Find the thieves');
    unmount();
  });

  it('Network hides clocks from players but not from the GM', () => {
    const gm = mountWith(TableView, 'gm');
    expect(gm.host.textContent).toContain('Find the thieves');
    expect(gm.host.textContent).toContain('+ CLOCK');
    gm.unmount();
    const player = mountWith(TableView, 'player');
    expect(player.errors).toEqual([]);
    expect(player.host.textContent).toContain('The Red Sashes');
    expect(player.host.textContent).not.toContain('Find the thieves');
    expect(player.host.textContent).not.toContain('+ CLOCK');
    player.unmount();
  });

  it('Sheets renders the rail with the crew and the character', () => {
    const { host, errors, unmount } = mountWith(SheetsView);
    expect(errors).toEqual([]);
    const text = host.textContent ?? '';
    expect(text).toMatch(/SCOUNDRELS/i);
    expect(text).toContain('Cross');
    expect(text).toMatch(/Shadows/i);
    unmount();
  });

  it('Sparks renders its engines and table groups', () => {
    const { host, errors, unmount } = mountWith(SparksView);
    expect(errors).toEqual([]);
    const text = host.textContent ?? '';
    expect(text).toMatch(/GENERIC/);
    expect(text).toMatch(/FACTIONS/);
    unmount();
  });

  it('Play renders the procedure reference', () => {
    const { host, errors, unmount } = mountWith(PlayView);
    expect(errors).toEqual([]);
    expect((host.textContent ?? '').length).toBeGreaterThan(500);
    unmount();
  });
});
