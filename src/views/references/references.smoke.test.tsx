// @vitest-environment jsdom
/**
 * Smoke test for the References view: mount it in local mode, check the rail lists every
 * registered entry, the first built sheet is shown by default, and clicking another rail
 * entry switches the main panel (and is remembered for the next visit).
 */
import { render } from 'preact';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../sync/firebase-config', () => ({ firebaseConfig: null }));

import example from '../../ledger/ledger.example.v1.json';
import { importLedger } from '../../ledger/normalize';
import { LedgerContext, makeLedgerApi } from '../../ui/context';
import { createStore } from '../../sync';
import { ReferencesView } from './index';
import { MANIFEST } from './manifest';

const LAST_KEY = 'doskvol-table:references:last';

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

beforeEach(() => {
  localStorage.clear();
});

function mount() {
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
    role: 'gm',
    update: (p) => store.update(p),
    replace: (l) => store.replace(l),
    pushRoll: () => {},
    clearRolls: () => {},
  });
  render(
    <LedgerContext.Provider value={api}>
      <ReferencesView />
    </LedgerContext.Provider>,
    host,
  );
  window.removeEventListener('error', onError);
  return {
    host,
    errors,
    unmount: () => {
      render(null, host);
      host.remove();
    },
  };
}

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

const railLabels = (host: HTMLElement) => Array.from(host.querySelectorAll('.rf-rail .rf-entry-label')).map((el) => el.textContent);
const mainImage = (host: HTMLElement) => host.querySelector<HTMLImageElement>('.rf-main img')?.getAttribute('src') ?? null;
const railButton = (host: HTMLElement, label: string) =>
  Array.from(host.querySelectorAll<HTMLButtonElement>('.rf-rail .rf-entry')).find((b) => b.querySelector('.rf-entry-label')?.textContent === label);

describe('References view', () => {
  it('lists the player kit pages in the rail, rules first and the map under handouts', () => {
    const { host, errors, unmount } = mount();
    expect(errors).toEqual([]);
    expect(railLabels(host)).toEqual(['Simple Rules Overview', 'Rules Reference 1', 'Rules Reference 2', 'GM Reference', 'Standard Items & Vice Purveyors', 'Doskvol']);
    expect(MANIFEST).toHaveLength(6);
    expect(MANIFEST.every((e) => e.kind === 'image')).toBe(true);
    const text = host.textContent ?? '';
    expect(text).toContain('RULES');
    expect(text).toContain('MAPS & HANDOUTS');
    unmount();
  });

  it('shows the first page by default with its credit', () => {
    const { host, errors, unmount } = mount();
    expect(errors).toEqual([]);
    expect(mainImage(host)).toMatch(/references\/playerkit-p01\.png$/);
    expect(host.querySelector('.rf-main figcaption')?.textContent).toBe('Blades in the Dark Player Kit v8.2, p. 1');
    unmount();
  });

  it('switches the main panel when another rail entry is clicked and remembers it', async () => {
    const { host, errors, unmount } = mount();
    const map = railButton(host, 'Doskvol');
    expect(map).toBeDefined();
    map!.click();
    await flush();
    expect(errors).toEqual([]);
    expect(mainImage(host)).toMatch(/references\/playerkit-p22\.png$/);
    expect(map!.getAttribute('aria-pressed')).toBe('true');
    expect(railButton(host, 'Simple Rules Overview')!.getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem(LAST_KEY)).toBe('kit-doskvol-map');
    unmount();
    const again = mount();
    expect(mainImage(again.host)).toMatch(/playerkit-p22\.png$/);
    again.unmount();
  });

  it('degrades gracefully when an image file is missing', async () => {
    const { host, errors, unmount } = mount();
    const img = host.querySelector<HTMLImageElement>('.rf-main img');
    expect(img).not.toBeNull();
    img!.dispatchEvent(new Event('error'));
    await flush();
    expect(errors).toEqual([]);
    expect(host.querySelector('.rf-main')?.textContent).toContain('references/playerkit-p01.png');
    expect(host.querySelector('.rf-main')?.textContent).toContain('has not been added to the repo yet');
    expect(railButton(host, 'Simple Rules Overview')!.textContent).toContain('not yet added');
    unmount();
  });
});
