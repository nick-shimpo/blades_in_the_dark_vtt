/**
 * Sparks logic, ported from the prototype's `// SPARKS` section of `renderVals`
 * (design/handoff/reference/Doskvol Table.dc.html). Pure functions over the bundled
 * spark tables and the book roster; rolled results are UI state only, never the ledger.
 */
import { book, sparks, type Faction, type SparkTable } from '../../data';

export type GroupId = 'generic' | 'doskvol' | 'factions' | 'playbooks' | 'score' | 'npc';

/** The table-group chips, in order. */
export const GROUPS: readonly { id: GroupId; label: string }[] = [
  { id: 'generic', label: 'GENERIC' },
  { id: 'doskvol', label: 'DOSKVOL' },
  { id: 'factions', label: 'FACTIONS' },
  { id: 'playbooks', label: 'PLAYBOOKS' },
  { id: 'score', label: 'SCORE' },
  { id: 'npc', label: 'NPC' },
];

/** Table ids behind the three engines at the top of the view. */
export const SPARK_IDS: readonly string[] = ['descriptor', 'action', 'object', 'motive', 'twist'];
export const SCORE_IDS: readonly string[] = ['scoretype', 'target', 'whynow', 'whycare'];
export const NPC_IDS: readonly string[] = ['npcrole', 'npcwant', 'npcproblem', 'tell'];

/** Faction categories offered as filter chips (the book's `special` entries have no chip). */
export const FACTION_CATS: readonly string[] = ['underworld', 'institutions', 'labor_and_trade', 'fringe'];

export type NameKind = 'name' | 'alias' | 'full';
/** Rolled indices, keyed by table id or `pb:<Playbook>:<category>`. */
export type Rolls = Record<string, number>;
export type Random = () => number;

export const tableById: ReadonlyMap<string, SparkTable> = new Map(sparks.tables.map((t) => [t.id, t]));
export const PLAYBOOK_NAMES: readonly string[] = Object.keys(sparks.playbookPrompts);

export function rnd(arr: readonly unknown[], random: Random = Math.random): number {
  return Math.floor(random() * arr.length);
}

/** A fresh index that differs from the previous one whenever the table has more than one entry. */
export function rollIndex(items: readonly unknown[], prev: number | undefined, random: Random = Math.random): number {
  let i = rnd(items, random);
  if (items.length > 1 && i === prev) i = (i + 1) % items.length;
  return i;
}

export function rollResult(rolls: Rolls, id: string): string | null {
  const t = tableById.get(id);
  const i = rolls[id];
  if (i == null || !t) return null;
  return t.items[i] ?? null;
}

/** `[3]` — the 1-based index shown beside a table result. */
export function rolledLabel(rolls: Rolls, id: string): string {
  const i = rolls[id];
  return i == null ? '' : `[${i + 1}]`;
}

/** The one-line seed under the Roll Spark engine. */
export function sparkLine(rolls: Rolls): string {
  const a = rollResult(rolls, 'descriptor');
  const b = rollResult(rolls, 'action');
  const c = rollResult(rolls, 'object');
  const d = rollResult(rolls, 'motive');
  if (!a || !b || !c || !d) return 'roll for a score seed…';
  return `${a} ${b.toLowerCase()} — a ${c.toLowerCase()}, for ${d.toLowerCase()}.`;
}

export function pbKey(playbook: string, cat: string): string {
  return `pb:${playbook}:${cat}`;
}

export function pbItems(playbook: string, cat: string): readonly string[] {
  return sparks.playbookPrompts[playbook]?.[cat] ?? [];
}

const CAT_SHORT: Record<string, string> = {
  underworld: 'UNDERWORLD',
  institutions: 'INSTITUTION',
  labor_and_trade: 'LABOR',
  fringe: 'FRINGE',
  special: 'SPECIAL',
  citizenry: 'CITIZENRY',
};

export function catShort(c: string | null | undefined): string {
  return CAT_SHORT[c ?? ''] ?? String(c ?? '').toUpperCase();
}

/** Every faction the finder can list: the book roster without the citizenry entry. */
export const finderFactions: readonly Faction[] = book.factions.filter((f) => f.id !== 'citizenry');

export function filteredFactions(q: string, cats: readonly string[]): Faction[] {
  const s = String(q ?? '').toLowerCase();
  return finderFactions.filter(
    (f) =>
      (!cats.length || cats.includes(f.category)) &&
      (!s || f.name.toLowerCase().includes(s) || String(f.summary ?? '').toLowerCase().includes(s) || String(f.category ?? '').includes(s)),
  );
}

export function genNameStr(kind: NameKind, random: Random = Math.random): string {
  const { first, family, alias } = sparks.names;
  if (kind === 'alias') return `“${alias[rnd(alias, random)]}”`;
  const given = first[rnd(first, random)];
  const surname = family[rnd(family, random)];
  if (kind === 'full') return `${given} “${alias[rnd(alias, random)]}” ${surname}`;
  return `${given} ${surname}`;
}

/** The tables listed under a group chip; FACTIONS and PLAYBOOKS show their own panels instead. */
export function tablesForGroup(group: GroupId): SparkTable[] {
  if (group === 'factions' || group === 'playbooks') return [];
  return sparks.tables.filter((t) => t.group === group);
}

/** The one-liner shown under a rolled district. */
export function districtSub(name: string): string | null {
  return sparks.districts.find((d) => d.n === name)?.s ?? null;
}
