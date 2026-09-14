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
const mainTitle = (host: HTMLElement) => host.querySelector('.rf-main h2')?.textContent;
const railButton = (host: HTMLElement, label: string) =>
  Array.from(host.querySelectorAll<HTMLButtonElement>('.rf-rail .rf-entry')).find((b) => b.querySelector('.rf-entry-label')?.textContent === label);

describe('References view', () => {
  it('lists the eight built sheets and the Doskvol handout in the rail', () => {
    const { host, errors, unmount } = mount();
    expect(errors).toEqual([]);
    const labels = railLabels(host);
    expect(labels).toEqual([
      'Action Roll',
      'Position & Effect',
      'Consequences & Resistance',
      'Teamwork',
      'Planning & Engagement',
      'Downtime',
      'Advancement & the Faction Game',
      'The Twelve Actions & Gathering Information',
      'Doskvol',
    ]);
    expect(MANIFEST.filter((e) => e.kind === 'sheet')).toHaveLength(8);
    const text = host.querySelector('.rf-rail')?.textContent ?? '';
    expect(text).toContain('RULES');
    expect(text).toContain('MAPS & HANDOUTS');
    unmount();
  });

  it('shows the first built sheet in the main panel by default, with its rules text', () => {
    const { host, errors, unmount } = mount();
    expect(errors).toEqual([]);
    expect(mainTitle(host)).toBe('Action Roll');
    const main = host.querySelector('.rf-main')?.textContent ?? '';
    expect(main).toContain('The player states their goal for the action.');
    expect(main).toContain('You do it with increased effect.');
    expect(main).toContain("It's the worst outcome.");
    unmount();
  });

  it('switches the main panel when another rail entry is clicked and remembers it', async () => {
    const { host, errors, unmount } = mount();
    const teamwork = railButton(host, 'Teamwork');
    expect(teamwork).toBeDefined();
    teamwork!.click();
    await flush();
    expect(errors).toEqual([]);
    expect(mainTitle(host)).toBe('Teamwork');
    expect(teamwork!.getAttribute('aria-pressed')).toBe('true');
    expect(railButton(host, 'Action Roll')!.getAttribute('aria-pressed')).toBe('false');
    expect(host.querySelector('.rf-main')?.textContent).toContain('best result counts for all');
    expect(localStorage.getItem(LAST_KEY)).toBe('teamwork');
    unmount();

    // a fresh mount on the same browser opens the remembered sheet
    const again = mount();
    expect(mainTitle(again.host)).toBe('Teamwork');
    again.unmount();
  });

  it('shows the image handout with its credit when selected', async () => {
    const { host, errors, unmount } = mount();
    railButton(host, 'Doskvol')!.click();
    await flush();
    expect(errors).toEqual([]);
    const img = host.querySelector<HTMLImageElement>('.rf-main .rf-figure img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toMatch(/references\/doskvol-map\.png$/);
    expect(host.querySelector('.rf-main figcaption')?.textContent).toBe('Official map, Blades in the Dark core rulebook');
    // a failed load degrades to the "not yet added" note in the rail and the main panel
    img!.dispatchEvent(new Event('error'));
    await flush();
    expect(host.querySelector('.rf-main')?.textContent).toContain('references/doskvol-map.png');
    expect(host.querySelector('.rf-main')?.textContent).toContain('has not been added to the repo yet');
    expect(railButton(host, 'Doskvol')!.textContent).toContain('not yet added');
    unmount();
  });
});
