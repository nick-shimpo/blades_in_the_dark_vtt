/**
 * Typed access to the bundled game content (design/handoff/data/*.json).
 * The JSON never changes at runtime; everything here is read-only.
 */
import bookJson from './book.json';
import sheetsJson from './sheets.json';
import sparksJson from './sparks.json';
import claimsJson from './claims-maps.json';

// ---------------------------------------------------------------- actions

export const ATTRIBUTES = ['insight', 'prowess', 'resolve'] as const;
export type AttributeId = (typeof ATTRIBUTES)[number];

export const ACTIONS_BY_ATTRIBUTE = {
  insight: ['hunt', 'study', 'survey', 'tinker'],
  prowess: ['finesse', 'prowl', 'skirmish', 'wreck'],
  resolve: ['attune', 'command', 'consort', 'sway'],
} as const;

export type ActionId = (typeof ACTIONS_BY_ATTRIBUTE)[AttributeId][number];
export const ALL_ACTIONS: readonly ActionId[] = [
  ...ACTIONS_BY_ATTRIBUTE.insight,
  ...ACTIONS_BY_ATTRIBUTE.prowess,
  ...ACTIONS_BY_ATTRIBUTE.resolve,
];

export function attributeOf(action: ActionId): AttributeId {
  for (const attr of ATTRIBUTES) {
    if ((ACTIONS_BY_ATTRIBUTE[attr] as readonly string[]).includes(action)) return attr;
  }
  throw new Error(`unknown action ${action}`);
}

export function isActionId(x: string): x is ActionId {
  return (ALL_ACTIONS as readonly string[]).includes(x);
}

// ---------------------------------------------------------------- sheets.json

export type PlaybookId = 'cutter' | 'hound' | 'leech' | 'lurk' | 'slide' | 'spider' | 'whisper';
export type CrewTypeId = 'assassins' | 'bravos' | 'cult' | 'hawkers' | 'shadows' | 'smugglers';

export interface Ability {
  id: string;
  name: string;
  text: string;
  note?: string;
}
export interface PlaybookItem {
  id: string;
  name: string;
  load: number;
  variable?: boolean;
  desc: string;
  note?: string;
}
export interface Friend {
  name: string;
  role: string;
  prompt: string;
}
export interface Build {
  name: string;
  dots: Partial<Record<ActionId, number>>;
  ability: string;
}
export interface Playbook {
  id: PlaybookId;
  name: string;
  page: number;
  tagline: string;
  xp: string;
  friendsBar: string;
  start: Partial<Record<ActionId, number>>;
  builds: Build[];
  friends: Friend[];
  abilities: Ability[];
  items: PlaybookItem[];
  picker: { goodAt: string; playIf: string };
}
export interface Upgrade {
  id: string;
  name: string;
  boxes: number;
  desc: string;
}
export interface Contact {
  name: string;
  role: string;
}
export interface Operation {
  name: string;
  desc: string;
}
export type GridPos = [number, number];
export interface ClaimsMap {
  page: number;
  rows: number;
  cols: number;
  hub: GridPos;
  tiles: string[][];
  connections: [GridPos, GridPos][];
}
export interface CrewType {
  id: CrewTypeId;
  name: string;
  page: number;
  tagline: string;
  blurb: string;
  xp: string;
  groundsLabel: string;
  operations: Operation[];
  deity: string;
  startingUpgrades: string[];
  contacts: Contact[];
  upgrades: Upgrade[];
  abilities: Ability[];
  benefits: Record<string, string>;
  map: ClaimsMap;
}
export interface StandardItem {
  id: string;
  name: string;
  load: number;
  desc: string;
}
export type NamedPair = [string, string];

export interface SheetsData {
  actions: Record<AttributeId, ActionId[]>;
  actionDesc: Record<ActionId, string>;
  heritage: NamedPair[];
  background: NamedPair[];
  vice: NamedPair[];
  trauma: NamedPair[];
  standardItems: StandardItem[];
  load: { light: number; normal: number; heavy: number; max: number };
  harmExamples: Record<'1' | '2' | '3', string>;
  reputations: string[];
  generalUpgrades: Upgrade[];
  cohort: { gangTypes: NamedPair[]; edges: NamedPair[]; flaws: NamedPair[]; harm: string[] };
  statusWords: Record<string, string>;
  playbooks: Playbook[];
  crews: CrewType[];
  maps: Record<string, ClaimsMap>;
}

export const sheets = sheetsJson as unknown as SheetsData;
export const playbooks: readonly Playbook[] = sheets.playbooks;
export const crewTypes: readonly CrewType[] = sheets.crews;

export function playbook(id: string | null | undefined): Playbook | undefined {
  return playbooks.find((p) => p.id === id);
}
export function crewType(id: string | null | undefined): CrewType | undefined {
  return crewTypes.find((c) => c.id === id);
}
export function playbookAbility(pbId: string, abilityId: string): Ability | undefined {
  return playbook(pbId)?.abilities.find((a) => a.id === abilityId);
}

export type AnyItem = (PlaybookItem | StandardItem) & { kind: 'playbook' | 'standard' };

/** All items a character of this playbook can carry: playbook items first, then the standard list. */
export function allItemsFor(pb: Playbook | undefined): AnyItem[] {
  const own: AnyItem[] = (pb?.items ?? []).map((i) => ({ ...i, kind: 'playbook' as const }));
  const std: AnyItem[] = sheets.standardItems.map((i) => ({ ...i, kind: 'standard' as const }));
  return [...own, ...std];
}

// ---------------------------------------------------------------- claims-maps.json

export interface ClaimsMapsFile {
  _about: string;
  maps: Record<string, ClaimsMap>;
}
export const claimsMaps: Record<string, ClaimsMap> = (claimsJson as unknown as ClaimsMapsFile).maps;

// ---------------------------------------------------------------- book.json

export interface FactionNpcRef {
  name: string;
  role: string;
  notes?: string;
  traits: string[];
}
export interface FactionClock {
  name: string;
  segments: number;
  filled?: number;
  repeating?: boolean;
}
export interface FactionDetail {
  page: number;
  tagline: string;
  turf: string;
  npcs: FactionNpcRef[];
  notable_assets: string;
  quirks: string;
  allies: { name: string; faction_id: string | null }[];
  enemies: { name: string; faction_id: string | null }[];
  situation: string;
  clocks: FactionClock[];
}
export interface Faction {
  id: string;
  name: string;
  category: string;
  tier: number;
  hold: 'strong' | 'weak' | string;
  summary: string | null;
  detail: FactionDetail | null;
  listed_in_faction_table: boolean;
  pages: number[];
  npc_ids: string[];
  location_ids: string[];
}
export interface District {
  id: string;
  name: string;
  page: number;
  summary: string;
  description: string;
  special_rule: string;
  scene: string;
  streets: { description: string; names: string[] };
  buildings: string;
  landmarks: { name: string; description: string }[];
  notables: { name: string; role?: string; description?: string }[];
  traits: { wealth: number; security_safety: number; criminal_influence: number; occult_influence: number };
  traits_scale: string;
  notable_npc_ids: string[];
  location_ids: string[];
  npc_ids: string[];
}
export interface NpcAppearance {
  source_type: string;
  source_ref: string;
  page: number;
  faction_id?: string;
  role?: string;
  notes?: string;
  traits?: string[];
  district_id?: string;
  playbook?: string;
  crew?: string;
  vice?: string;
  venue?: string;
  location_id?: string;
}
export interface Npc {
  id: string;
  name: string;
  aliases: string[];
  kind: string;
  status: string;
  roles: string[];
  traits: string[];
  faction_ids: string[];
  district_ids: string[];
  vices_purveyed: string[];
  playbook_friend_of: string[];
  crew_contact_of: string[];
  appearances: NpcAppearance[];
  pages: number[];
  possible_same_as: string[];
  description?: string;
}
export interface Location {
  id: string;
  name: string;
  type: string;
  district_id: string | null;
  description: string;
  faction_ids: string[];
  npc_ids: string[];
  pages: number[];
  notes: string | null;
}
export interface VicePurveyor {
  vice: string;
  npc: string;
  venue: string;
  district_id: string | null;
  raw: string;
  location_id: string | null;
  npc_id: string | null;
}
export interface BookData {
  manifest: { source: string; extracted: string };
  factions: Faction[];
  districts: District[];
  city_landmarks: { id: string; name: string; map_number: number; description: string }[];
  npcs: Npc[];
  locations: Location[];
  vice_purveyors: { page: number; entries: VicePurveyor[]; notes: string[] };
  setting: Record<string, unknown>;
  generators: Record<string, unknown>;
}

export const book = bookJson as unknown as BookData;

const byId = <T extends { id: string }>(xs: T[]) => new Map(xs.map((x) => [x.id, x] as const));
export const bookIndex = {
  factions: byId(book.factions),
  districts: byId(book.districts),
  npcs: byId(book.npcs),
  locations: byId(book.locations),
};

export type BookKind = 'faction' | 'npc' | 'location' | 'district';
export type BookEntry =
  | { kind: 'faction'; entry: Faction }
  | { kind: 'npc'; entry: Npc }
  | { kind: 'location'; entry: Location }
  | { kind: 'district'; entry: District };

export function bookEntry(kind: BookKind, ref: string): BookEntry | undefined {
  switch (kind) {
    case 'faction': {
      const e = bookIndex.factions.get(ref);
      return e && { kind, entry: e };
    }
    case 'npc': {
      const e = bookIndex.npcs.get(ref);
      return e && { kind, entry: e };
    }
    case 'location': {
      const e = bookIndex.locations.get(ref);
      return e && { kind, entry: e };
    }
    case 'district': {
      const e = bookIndex.districts.get(ref);
      return e && { kind, entry: e };
    }
  }
}

export const districtNames: readonly string[] = book.districts.map((d) => d.name);

// ---------------------------------------------------------------- sparks.json

export interface SparkTable {
  id: string;
  title: string;
  die: string;
  items: string[];
  group: 'generic' | 'doskvol' | 'npc' | 'score' | string;
}
export interface SparksData {
  tables: SparkTable[];
  playbookPrompts: Record<string, Record<string, string[]>>;
  playbookPromptCategories: NamedPair[];
  names: { first: string[]; family: string[]; alias: string[] };
  venues: string[];
  districts: { n: string; s: string }[];
  specialPlaces: string[];
  factionsShort: { n: string; c: string; t: string; h: string; d: string }[];
  clockSizes: number[];
  nodeTypes: string[];
}
export const sparks = sparksJson as unknown as SparksData;

// ---------------------------------------------------------------- misc constants

export const CLOCK_SIZES = [4, 6, 8, 10, 12] as const;
export type ClockSize = (typeof CLOCK_SIZES)[number];

export const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI'] as const;
export function roman(n: number): string {
  return ROMAN[Math.max(0, Math.min(6, Math.round(n)))];
}
export function romanToInt(r: string): number {
  const i = (ROMAN as readonly string[]).indexOf(r.trim().toUpperCase());
  return i < 0 ? 0 : i;
}

/** The required CC-BY attribution, shown in the footer / rail. */
export const ATTRIBUTION =
  'This work is based on Blades in the Dark (found at http://www.bladesinthedark.com/), product of One Seven Design, developed and authored by John Harper, and licensed for our use under the Creative Commons Attribution 3.0 Unported license.';
