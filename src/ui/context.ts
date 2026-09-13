import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { CharacterSheet, CrewSheet, Ledger, RollRecord, TableNode } from '../ledger/types';
import { shallowDiffPatch, type Patch, type Store, type StoreStatus } from '../sync';

export interface LedgerApi {
  ledger: Ledger;
  store: Store;
  status: StoreStatus;
  rolls: RollRecord[];
  /** 'gm' when opened through the GM link, otherwise 'player'. */
  role: Role;
  /** Low-level: write a patch of ledger-relative paths. */
  update(patch: Patch): void;
  /** Replace the whole ledger (import, new campaign). */
  replace(ledger: Ledger): void;
  /** Write only the changed top-level fields of a character sheet. */
  saveChar(before: CharacterSheet, after: CharacterSheet): void;
  /** Write only the changed top-level fields of the crew sheet. */
  saveCrew(before: CrewSheet, after: CrewSheet): void;
  /** Write only the changed top-level fields of a table card. */
  saveNode(before: TableNode, after: TableNode): void;
  pushRoll(roll: RollRecord): void;
}

export const LedgerContext = createContext<LedgerApi | null>(null);

export function useLedger(): LedgerApi {
  const api = useContext(LedgerContext);
  if (!api) throw new Error('useLedger outside of a campaign');
  return api;
}

export function makeLedgerApi(base: Omit<LedgerApi, 'saveChar' | 'saveCrew' | 'saveNode'>): LedgerApi {
  return {
    ...base,
    saveChar(before, after) {
      const p = shallowDiffPatch(`sheets/chars/${after.id}`, before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>);
      if (Object.keys(p).length) base.update(p);
    },
    saveCrew(before, after) {
      const p = shallowDiffPatch('sheets/crew', before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>);
      if (Object.keys(p).length) base.update(p);
    },
    saveNode(before, after) {
      const p = shallowDiffPatch(`nodes/${after.id}`, before as unknown as Record<string, unknown>, after as unknown as Record<string, unknown>);
      if (Object.keys(p).length) base.update(p);
    },
  };
}

/**
 * Views. The ids are the URL segments; the folders under src/views keep their original names
 * (network = views/table, play = views/scene, tools = views/play).
 */
export type ViewId = 'network' | 'play' | 'sparks' | 'tools' | 'sheets';
export const VIEWS: { id: ViewId; label: string; key: string }[] = [
  { id: 'network', label: 'Network', key: '1' },
  { id: 'play', label: 'Play', key: '2' },
  { id: 'sparks', label: 'Sparks', key: '3' },
  { id: 'tools', label: 'Tools', key: '4' },
  { id: 'sheets', label: 'Sheets', key: '5' },
];

/**
 * Who is looking: decided by the URL alone (`#/gm/<id>` vs `#/c/<id>`), no authentication.
 * The GM link is a courtesy split, not a secret: anyone who knows the pattern can open it.
 */
export type Role = 'gm' | 'player';
