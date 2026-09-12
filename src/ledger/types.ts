/**
 * The ledger: one campaign document.
 *
 * v2 (this app, and the shape stored in Firebase): collections are id-keyed maps so that
 * several people can write different items at the same time without overwriting each other.
 *
 * v1 (the prototype's file format, design/handoff/docs/ledger-schema.md): the same data with
 * arrays instead of maps. Import and export convert between the two (see normalize.ts).
 */
import type { ActionId, AttributeId, CrewTypeId, PlaybookId } from '../data';

export type NodeType = 'crew' | 'faction' | 'npc' | 'location' | 'district' | 'org' | 'other';
export type Side = 'n' | 's' | 'e' | 'w';
export type Relation = '' | 'friend' | 'rival';
export type Track = 'playbook' | AttributeId;
export type LoadClass = 'light' | 'normal' | 'heavy';

export interface Clock {
  id: string;
  name: string;
  size: number; // 4 | 6 | 8 | 10 | 12
  filled: number;
}

export interface TableNode {
  id: string;
  type: NodeType;
  name: string;
  x: number;
  y: number;
  ref?: string; // id into book.json when added from the book
  page?: number;
  tier: string; // roman numeral '', '0', 'I' … 'VI'
  district: string;
  status: number; // -3 … +3
  blurb: string;
  wants: string;
  details: string;
  moves: string;
  notes: string;
  f: Record<string, string>; // templated book fields, editable
  clocks: Record<string, Clock>;
  bookClocksSeeded?: boolean;
  createdAt?: number;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  label: string;
  note?: string;
  fromSide?: Side;
  toSide?: Side;
}

export interface Cohort {
  id: string;
  kind: 'gang' | 'expert';
  name: string;
  types: string[]; // gang types, max 2
  expertType: string;
  edges: string[]; // max 2
  flaws: string[]; // max 2
  harm: 0 | 1 | 2 | 3 | 4;
  armor: boolean;
}

export interface CrewSheet {
  type: CrewTypeId | null;
  reputation: string;
  lair: string;
  lairDistrict: string;
  groundsDistrict: string;
  operation: string;
  deity: string;
  rep: number; // 0 … 12 − turf
  tier: number; // 0 … 6
  hold: 'weak' | 'strong';
  heat: number; // 0 … 8
  wanted: number; // 0 … 4
  coin: number; // 0 … coinCap
  xp: number; // 0 … 7
  advances: number; // unspent crew advances
  abilities: Record<string, boolean>;
  upgrades: Record<string, number>; // boxes filled
  cohorts: Record<string, Cohort>;
  claims: Record<string, boolean>; // 'row,col' → held
  contacts: Record<string, Relation>;
}

export interface HarmRows {
  '3': [string];
  '2': [string, string];
  '1': [string, string];
}

export interface CharacterSheet {
  id: string;
  playbook: PlaybookId;
  name: string;
  alias: string;
  look: string;
  heritage: string;
  heritageDetail: string;
  background: string;
  backgroundDetail: string;
  vice: string;
  viceDetail: string;
  stress: number;
  trauma: number;
  traumaConds: string[];
  harm: HarmRows;
  healing: number; // 0 … 3
  armor: { armor?: boolean; heavy?: boolean; special?: boolean };
  abilities: Record<string, boolean>;
  veteran: { pb: PlaybookId; id: string }[];
  xp: Partial<Record<Track, number>>;
  advances: Partial<Record<Track, number>>;
  actions: Partial<Record<ActionId, number>>;
  load: LoadClass;
  items: Record<string, boolean>;
  coin: number; // 0 … 4
  stash: number; // 0 … 40
  friends: Record<string, Relation>;
  createdAt: number;
}

export interface Ledger {
  v: 2;
  crew: { name: string; meta: string };
  nodes: Record<string, TableNode>;
  edges: Record<string, Edge>;
  sheets: { crew: CrewSheet; chars: Record<string, CharacterSheet> };
  savedAt?: string;
}

/** A shared dice result (not part of the exported ledger). */
export interface RollRecord {
  id: string;
  at: number;
  who: string; // character or crew name
  kind: 'action' | 'resistance' | 'fortune';
  label: string; // e.g. 'Skirmish' or 'Prowess'
  position?: 'controlled' | 'risky' | 'desperate';
  effect?: 'limited' | 'standard' | 'great';
  dice: number[];
  pool: number;
  result: 'critical' | 'success' | 'partial' | 'failure';
}

// ---------------------------------------------------------------- v1 file shape

export interface ClockV1 {
  id: string;
  name: string;
  size: number;
  filled: number;
}
export interface NodeV1 extends Omit<TableNode, 'clocks'> {
  clocks: ClockV1[];
}
export interface EdgeV1 extends Edge {
  dir?: 1 | 2 | 3; // legacy: 1 forward, 2 reverse, 3 both
  str?: number;
}
export interface CrewSheetV1 extends Omit<CrewSheet, 'cohorts'> {
  cohorts: Cohort[];
}
export interface LedgerFileV1 {
  app: 'bitd-gm-cockpit';
  v: 1;
  savedAt: string;
  seq: number;
  crew: { name: string; meta?: string };
  nodes: NodeV1[];
  edges: EdgeV1[];
  sheets?: { crew: CrewSheetV1; chars: CharacterSheet[] };
  score?: string;
}
