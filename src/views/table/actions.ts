/**
 * Table actions that other views (Sparks) call to put things on the Table, plus the
 * book-relationship logic (RELATED / autoLink), edge helpers and the card schema the
 * Table view itself uses. The Table view owns this file; keep the exported signatures
 * `placeNear`, `fieldsFromBook`, `bookClocks`, `nodeByRef`, `addBookNode`, `addCustomNode`,
 * `CENTRE_EVENT`, `centreOn` stable.
 */
import { book, bookEntry, roman, type BookKind, type Faction, type Npc } from '../../data';
import { newId } from '../../ledger/ids';
import { nodeWidth } from '../../ledger/rules';
import type { Clock, Edge, Ledger, NodeType, Side, TableNode } from '../../ledger/types';
import type { Patch } from '../../sync';
import type { LedgerApi } from '../../ui/context';

export interface Point {
  x: number;
  y: number;
}

const WORLD_CENTRE: Point = { x: 2000, y: 1500 };

/** A spot near the given point (or the world centre) that is not already occupied by a card. */
export function placeNear(api: LedgerApi, at?: Point, radius = 330): Point {
  const origin = at ?? WORLD_CENTRE;
  const nodes = Object.values(api.ledger.nodes);
  const taken = (p: Point) => nodes.some((n) => Math.hypot(n.x - p.x, n.y - p.y) < 220);
  if (!taken(origin)) return origin;
  for (let ring = 1; ring <= 4; ring++) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + ring * 0.26;
      const p = { x: Math.round(origin.x + Math.cos(a) * radius * ring), y: Math.round(origin.y + Math.sin(a) * radius * 0.7 * ring) };
      if (!taken(p)) return p;
    }
  }
  return { x: origin.x + 40 * nodes.length, y: origin.y + 30 * nodes.length };
}

/** Spots handed out in the last moment, so that several cards added in a row do not stack. */
const recentSpots: { x: number; y: number; t: number }[] = [];

/**
 * A free spot around a source card (RELATED adds): 12 candidate angles at radius w/2 + 190,
 * scored by how much each candidate overlaps existing cards (rules-engine.md section 1).
 */
export function placeAround(api: LedgerApi, src: TableNode): Point {
  const now = Date.now();
  for (let i = recentSpots.length - 1; i >= 0; i--) if (now - recentSpots[i].t > 1500) recentSpots.splice(i, 1);
  const pts: Point[] = [...Object.values(api.ledger.nodes).map((n) => ({ x: n.x, y: n.y })), ...recentSpots];
  const R = nodeWidth(src.type) / 2 + 190;
  let best: Point = { x: src.x + R, y: src.y };
  let bestScore = Infinity;
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + i * ((Math.PI * 2) / 12);
    const x = src.x + Math.cos(a) * R;
    const y = src.y + Math.sin(a) * R * 0.8;
    const score =
      pts.reduce((s, p) => {
        const d = Math.hypot(p.x - x, p.y - y);
        return s + (d < 220 ? 220 - d : 0);
      }, 0) +
      i * 0.01;
    if (score < bestScore) {
      bestScore = score;
      best = { x: Math.round(x), y: Math.round(y) };
    }
  }
  recentSpots.push({ ...best, t: now });
  return best;
}

/** The templated fields a card carries for its book entry (editable afterwards). */
export function fieldsFromBook(kind: BookKind, ref: string): { f: Record<string, string>; name: string; tier: string; district: string; page?: number; type: NodeType } | null {
  const e = bookEntry(kind, ref);
  if (!e) return null;
  const districtName = (id: string | null | undefined) => (id ? bookEntry('district', id)?.entry.name ?? '' : '');
  switch (e.kind) {
    case 'faction': {
      const fa = e.entry as Faction;
      const d = fa.detail;
      return {
        type: 'faction',
        name: fa.name,
        tier: roman(fa.tier),
        district: '',
        page: d?.page ?? fa.pages[0],
        f: {
          hold: fa.hold,
          category: fa.category,
          tagline: d?.tagline ?? fa.summary ?? '',
          turf: d?.turf ?? '',
          npcs: (d?.npcs ?? []).map((n) => `${n.name} (${n.role}${n.notes ? `, ${n.notes}` : ''})`).join('; '),
          assets: d?.notable_assets ?? '',
          quirks: d?.quirks ?? '',
          allies: (d?.allies ?? []).map((a) => a.name).join(', '),
          enemies: (d?.enemies ?? []).map((a) => a.name).join(', '),
          situation: d?.situation ?? '',
        },
      };
    }
    case 'npc': {
      const n = e.entry;
      const factions = n.faction_ids.map((id) => bookEntry('faction', id)?.entry.name ?? id).join(', ');
      return {
        type: 'npc',
        name: n.name,
        tier: '',
        district: districtName(n.district_ids[0]),
        page: n.pages[0],
        f: {
          roles: n.roles.join(', '),
          faction: factions,
          traits: n.traits.join(', '),
          kind: n.kind,
          description: n.description ?? n.appearances.map((a) => a.notes).filter(Boolean).join(' ') ?? '',
        },
      };
    }
    case 'location': {
      const l = e.entry;
      return {
        type: 'location',
        name: l.name,
        tier: '',
        district: districtName(l.district_id),
        page: l.pages[0],
        f: { kind: l.type.replace(/_/g, ' '), description: l.description, factions: l.faction_ids.map((id) => bookEntry('faction', id)?.entry.name ?? id).join(', ') },
      };
    }
    case 'district': {
      const d = e.entry;
      return {
        type: 'district',
        name: d.name,
        tier: '',
        district: d.name,
        page: d.page,
        f: {
          summary: d.summary,
          description: d.description,
          scene: d.scene,
          streets: [d.streets.description, d.streets.names.join(', ')].filter(Boolean).join(' '),
          buildings: d.buildings,
          landmarks: d.landmarks.map((l) => `${l.name}: ${l.description}`).join('\n'),
          special_rule: d.special_rule,
          notables: d.notables.map((n) => [n.name, n.role, n.description].filter(Boolean).join(', ')).join('\n'),
        },
      };
    }
  }
}

/** A faction's book clocks, created once as real clocks. */
export function bookClocks(ref: string): Record<string, Clock> {
  const e = bookEntry('faction', ref);
  const out: Record<string, Clock> = {};
  if (e?.kind !== 'faction' || !e.entry.detail) return out;
  e.entry.detail.clocks.forEach((c, i) => {
    const id = `bk-${ref}-${i}`;
    const size = [4, 6, 8, 10, 12].includes(c.segments) ? c.segments : 6;
    out[id] = { id, name: c.name + (c.repeating ? ' (repeating)' : ''), size, filled: Math.max(0, Math.min(size, c.filled ?? 0)) };
  });
  return out;
}

export function nodeByRef(api: LedgerApi, ref: string): TableNode | undefined {
  return Object.values(api.ledger.nodes).find((n) => n.ref === ref);
}

/** The card that carries a given book entry (kind + ref), if it is on the table. */
export function nodeForEntry(nodes: Record<string, TableNode>, kind: BookKind, ref: string): TableNode | undefined {
  return Object.values(nodes).find((n) => n.ref === ref && n.type === kind);
}

/**
 * Add a book entry to the Table. If it is already there, returns the existing node (callers centre on it).
 * Returns the node that is now on the table.
 */
export function addBookNode(api: LedgerApi, kind: BookKind, ref: string, at?: Point): TableNode | undefined {
  const existing = nodeByRef(api, ref);
  if (existing) return existing;
  const tpl = fieldsFromBook(kind, ref);
  if (!tpl) return undefined;
  const p = placeNear(api, at);
  const node: TableNode = {
    id: newId('n'),
    type: tpl.type,
    name: tpl.name,
    x: p.x,
    y: p.y,
    ref,
    page: tpl.page,
    tier: tpl.tier,
    district: tpl.district,
    status: 0,
    blurb: '',
    wants: '',
    details: '',
    moves: '',
    notes: '',
    f: tpl.f,
    clocks: kind === 'faction' ? bookClocks(ref) : {},
    createdAt: Date.now(),
  };
  if (kind === 'faction') node.bookClocksSeeded = true;
  api.update({ [`nodes/${node.id}`]: node });
  return node;
}

/** Add a card of your own. */
export function addCustomNode(api: LedgerApi, type: NodeType, name: string, at?: Point, extra: Partial<TableNode> = {}): TableNode {
  const p = placeNear(api, at);
  const node: TableNode = {
    id: newId('n'),
    type,
    name: name || 'Unnamed',
    x: p.x,
    y: p.y,
    tier: type === 'faction' || type === 'org' ? 'I' : '',
    district: '',
    status: 0,
    blurb: '',
    wants: '',
    details: '',
    moves: '',
    notes: '',
    f: {},
    clocks: {},
    createdAt: Date.now(),
    ...extra,
  };
  api.update({ [`nodes/${node.id}`]: node });
  return node;
}

/** Ask the Table to centre on a card (the Table listens; harmless if it is not mounted). */
export const CENTRE_EVENT = 'doskvol:centre-node';
export function centreOn(nodeId: string): void {
  window.dispatchEvent(new CustomEvent(CENTRE_EVENT, { detail: nodeId }));
}

// ================================================================ card vocabulary

export const GLYPH: Record<NodeType, string> = { faction: '⚑', npc: '♟', location: '⌖', district: '◈', crew: '◆', org: '⚖', other: '✦' };
export const TYPE_TAG: Record<NodeType, string> = { crew: 'CREW', faction: 'FACTION', npc: 'NPC', location: 'PLACE', district: 'DISTRICT', org: 'ORG', other: 'OTHER' };
export const CUSTOM_NAMES: Record<NodeType, string> = {
  faction: 'New faction',
  npc: 'New NPC',
  location: 'New place',
  district: 'New district',
  org: 'New organisation',
  other: 'New node',
  crew: 'The Crew',
};

export function bookKindOf(type: NodeType): BookKind | null {
  return type === 'faction' || type === 'npc' || type === 'location' || type === 'district' ? type : null;
}

/** The book entry behind a card, if it came from the book. */
export function bookEntryOf(node: TableNode) {
  const kind = bookKindOf(node.type);
  return kind && node.ref ? bookEntry(kind, node.ref) : undefined;
}

/**
 * Dossier schema per card type: which `f` fields are facts (inline-edited values) and which are
 * prose sections (markdown). `aliases` are the prototype's key names for the same field, so
 * ledgers imported from it show their content; writes go to every key that already exists.
 * `optional` facts are only shown when they carry a value.
 */
export interface SchemaField {
  key: string;
  label: string;
  kind: 'fact' | 'prose' | 'hidden';
  aliases?: string[];
  optional?: boolean;
}

export const SCHEMA: Record<NodeType, SchemaField[]> = {
  faction: [
    { key: 'hold', label: 'HOLD', kind: 'hidden' },
    { key: 'category', label: 'CATEGORY', kind: 'hidden' },
    { key: 'tagline', label: 'TAGLINE', kind: 'fact' },
    { key: 'turf', label: 'TURF', kind: 'prose' },
    { key: 'npcs', label: 'NOTABLE NPCS', kind: 'prose' },
    { key: 'assets', label: 'NOTABLE ASSETS', kind: 'prose' },
    { key: 'quirks', label: 'QUIRKS', kind: 'prose' },
    { key: 'allies', label: 'ALLIES', kind: 'fact' },
    { key: 'enemies', label: 'ENEMIES', kind: 'fact' },
    { key: 'situation', label: 'SITUATION', kind: 'prose' },
  ],
  npc: [
    { key: 'roles', label: 'ROLE', kind: 'fact', aliases: ['role'] },
    { key: 'traits', label: 'TRAITS', kind: 'fact' },
    { key: 'faction', label: 'FACTION', kind: 'fact', aliases: ['factions'] },
    { key: 'kind', label: 'KIND', kind: 'fact' },
    { key: 'condition', label: 'CONDITION', kind: 'fact', optional: true },
    { key: 'aliases', label: 'ALIASES', kind: 'fact', optional: true },
    { key: 'vices', label: 'VICES PURVEYED', kind: 'fact', optional: true },
    { key: 'friendOf', label: 'PLAYBOOK TIES', kind: 'fact', optional: true },
    { key: 'description', label: 'DESCRIPTION', kind: 'prose' },
  ],
  location: [
    { key: 'kind', label: 'TYPE OF PLACE', kind: 'fact', aliases: ['ltype'] },
    { key: 'factions', label: 'FACTIONS', kind: 'fact' },
    { key: 'people', label: 'PEOPLE', kind: 'fact', optional: true },
    { key: 'description', label: 'DESCRIPTION', kind: 'prose' },
  ],
  district: [
    { key: 'summary', label: 'SUMMARY', kind: 'fact' },
    { key: 'traits', label: 'RATINGS', kind: 'fact', optional: true },
    { key: 'description', label: 'DESCRIPTION', kind: 'prose' },
    { key: 'scene', label: 'SCENE', kind: 'prose' },
    { key: 'streets', label: 'STREETS', kind: 'prose' },
    { key: 'buildings', label: 'BUILDINGS', kind: 'prose' },
    { key: 'landmarks', label: 'LANDMARKS', kind: 'prose' },
    { key: 'special_rule', label: 'SPECIAL RULE', kind: 'prose', aliases: ['specialRule'] },
    { key: 'notables', label: 'NOTABLES', kind: 'prose' },
  ],
  crew: [
    { key: 'crewType', label: 'CREW TYPE', kind: 'fact' },
    { key: 'reputation', label: 'REPUTATION', kind: 'fact' },
    { key: 'lair', label: 'LAIR', kind: 'fact' },
    { key: 'hunting', label: 'HUNTING GROUNDS', kind: 'fact' },
  ],
  org: [
    { key: 'category', label: 'CATEGORY', kind: 'hidden' },
    { key: 'tagline', label: 'TAGLINE', kind: 'fact' },
    { key: 'assets', label: 'ASSETS', kind: 'prose' },
    { key: 'situation', label: 'SITUATION', kind: 'prose' },
  ],
  other: [
    { key: 'tagline', label: 'TAGLINE', kind: 'fact' },
    { key: 'description', label: 'DESCRIPTION', kind: 'prose' },
  ],
};

/** Read a schema field from a node's `f`, falling back to the prototype's key names. */
export function readField(node: TableNode, field: SchemaField): string {
  const f = node.f ?? {};
  if (f[field.key]?.trim()) return f[field.key];
  for (const a of field.aliases ?? []) if (f[a]?.trim()) return f[a];
  return f[field.key] ?? '';
}

/** A new `f` map with the field set (aliases that already exist are kept in step). */
export function writeField(node: TableNode, field: SchemaField, value: string): Record<string, string> {
  const f = { ...(node.f ?? {}), [field.key]: value };
  for (const a of field.aliases ?? []) if (a in f) f[a] = value;
  return f;
}

// ================================================================ relationships from the book

export type RelationLabel = 'Leads' | 'Member' | 'Holds' | 'In' | 'Based in' | 'Frequents' | 'Purveys at' | 'Allied' | 'Hostile' | 'Contests';

export interface RelatedItem {
  kind: BookKind;
  ref: string;
  name: string;
  /** Italic role shown in the popover ("leader", "turf", "purveys weed" ...). */
  sub: string;
  /** Which end the arrow starts at: the card itself, or the related entry. */
  from: 'self' | 'other';
  label: RelationLabel;
}

/** Labels that describe structure (drawn automatically when both cards are on the table). */
export const STRUCTURAL_LABELS: ReadonlySet<string> = new Set(['Leads', 'Member', 'Holds', 'In', 'Based in', 'Frequents', 'Purveys at']);

const LEAD_ROLE = /leader|boss|head|chief|captain|master|matriarch|patriarch|lord|lady|commander|high/i;
export const isLeadRole = (s: string | undefined) => LEAD_ROLE.test(s ?? '');

const nameKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const placeType = (type: string) => type.replace(/_/g, ' ');

interface Conflict {
  district_id?: string;
  factions?: string[];
}

function underworldConflicts(): Conflict[] {
  const uc = book.setting?.underworld_conflicts as { conflicts?: Conflict[] } | undefined;
  return uc?.conflicts ?? [];
}

/** Everything the book links to a card: people, factions, places, districts (rules-engine.md section 1). */
export function relatedOf(node: TableNode): RelatedItem[] {
  const kind = bookKindOf(node.type);
  const rec = bookEntryOf(node);
  if (!kind || !rec) return [];
  const out: RelatedItem[] = [];
  const seen = new Set<string>();
  const push = (k: BookKind, ref: string, sub: string, from: 'self' | 'other', label: RelationLabel) => {
    const key = `${k}:${ref}`;
    if (seen.has(key) || (k === kind && ref === node.ref)) return;
    const e = bookEntry(k, ref);
    if (!e) return;
    seen.add(key);
    out.push({ kind: k, ref, name: e.entry.name, sub, from, label });
  };
  const npcByName = (name: string): Npc | undefined => {
    const k = nameKey(name);
    return book.npcs.find((p) => nameKey(p.name) === k || p.aliases.some((a) => nameKey(a) === k));
  };
  const vice = book.vice_purveyors?.entries ?? [];

  if (rec.kind === 'faction') {
    const fa = rec.entry;
    const d = fa.detail;
    const roleOf = (p: Npc) => d?.npcs.find((x) => nameKey(x.name) === nameKey(p.name))?.role || p.roles[0] || '';
    for (const id of fa.npc_ids) {
      const p = book.npcs.find((x) => x.id === id);
      const role = p ? roleOf(p) : '';
      push('npc', id, role, 'other', isLeadRole(role) ? 'Leads' : 'Member');
    }
    for (const x of d?.npcs ?? []) {
      const p = npcByName(x.name);
      if (p) push('npc', p.id, x.role, 'other', isLeadRole(x.role) ? 'Leads' : 'Member');
    }
    for (const p of book.npcs) {
      if (p.faction_ids.includes(fa.id)) push('npc', p.id, roleOf(p), 'other', isLeadRole(p.roles.join(' ')) ? 'Leads' : 'Member');
    }
    for (const a of d?.allies ?? []) if (a.faction_id) push('faction', a.faction_id, 'ally', 'self', 'Allied');
    for (const a of d?.enemies ?? []) if (a.faction_id) push('faction', a.faction_id, 'enemy', 'self', 'Hostile');
    for (const o of book.factions) {
      if (o.detail?.allies.some((a) => a.faction_id === fa.id)) push('faction', o.id, 'ally', 'other', 'Allied');
      if (o.detail?.enemies.some((a) => a.faction_id === fa.id)) push('faction', o.id, 'enemy', 'other', 'Hostile');
    }
    for (const id of fa.location_ids) push('location', id, 'turf', 'self', 'Holds');
    for (const l of book.locations) if (l.faction_ids.includes(fa.id)) push('location', l.id, placeType(l.type), 'self', 'Holds');
  } else if (rec.kind === 'npc') {
    const p = rec.entry;
    const leads = isLeadRole(p.roles.join(' '));
    for (const id of p.faction_ids) push('faction', id, p.roles[0] || 'member', 'self', leads ? 'Leads' : 'Member');
    for (const id of p.district_ids) push('district', id, 'based in', 'self', 'Based in');
    for (const l of book.locations) if (l.npc_ids.includes(p.id)) push('location', l.id, placeType(l.type), 'self', 'Frequents');
    for (const v of vice) if (v.npc_id === p.id && v.location_id) push('location', v.location_id, `purveys ${v.vice}`, 'self', 'Purveys at');
  } else if (rec.kind === 'location') {
    const l = rec.entry;
    if (l.district_id) push('district', l.district_id, 'district', 'self', 'In');
    for (const id of l.faction_ids) push('faction', id, 'holds it', 'other', 'Holds');
    for (const id of l.npc_ids) push('npc', id, 'found here', 'other', 'Frequents');
    for (const v of vice) if (v.location_id === l.id && v.npc_id) push('npc', v.npc_id, `purveys ${v.vice}`, 'other', 'Purveys at');
  } else {
    const d = rec.entry;
    for (const id of [...d.notable_npc_ids, ...d.npc_ids]) {
      const p = book.npcs.find((x) => x.id === id);
      push('npc', id, p?.roles[0] || 'notable', 'other', 'Based in');
    }
    for (const id of d.location_ids) {
      const l = book.locations.find((x) => x.id === id);
      push('location', id, l ? placeType(l.type) : '', 'other', 'In');
    }
    for (const l of book.locations) if (l.district_id === d.id) push('location', l.id, placeType(l.type), 'other', 'In');
    for (const cf of underworldConflicts()) if (cf.district_id === d.id) for (const fid of cf.factions ?? []) push('faction', fid, 'contests it', 'other', 'Contests');
  }
  return out;
}

// ================================================================ edges

export interface WantedEdge {
  from: string;
  to: string;
  label: string;
  fromSide?: Side;
  toSide?: Side;
}

/** New edge records for the wanted links that do not exist yet (same from -> to), deduped within the batch. */
export function newEdgesFor(ledger: Ledger, wanted: WantedEdge[]): Edge[] {
  const have = new Set(Object.values(ledger.edges).map((e) => `${e.from}>${e.to}`));
  const out: Edge[] = [];
  for (const w of wanted) {
    if (w.from === w.to) continue;
    const k = `${w.from}>${w.to}`;
    if (have.has(k)) continue;
    have.add(k);
    const e: Edge = { id: newId('e'), from: w.from, to: w.to, label: w.label };
    if (w.fromSide) e.fromSide = w.fromSide;
    if (w.toSide) e.toSide = w.toSide;
    out.push(e);
  }
  return out;
}

export function edgesPatch(edges: Edge[]): Patch {
  const p: Patch = {};
  for (const e of edges) p[`edges/${e.id}`] = e;
  return p;
}

/** The one-way link a RELATED row describes, oriented by its `from`. */
export function relationEdge(node: TableNode, other: TableNode, item: Pick<RelatedItem, 'from' | 'label'>): WantedEdge {
  return item.from === 'self' ? { from: node.id, to: other.id, label: item.label } : { from: other.id, to: node.id, label: item.label };
}

/** Structural book relations from a card to cards already on the table, as a patch (may be empty). */
export function autoLinkPatch(ledger: Ledger, node: TableNode, extra: WantedEdge[] = []): Patch {
  const wanted: WantedEdge[] = [...extra];
  for (const it of relatedOf(node)) {
    if (!STRUCTURAL_LABELS.has(it.label)) continue;
    const other = nodeForEntry(ledger.nodes, it.kind, it.ref);
    if (other && other.id !== node.id) wanted.push(relationEdge(node, other, it));
  }
  return edgesPatch(newEdgesFor(ledger, wanted));
}

/** Draw the structural book relations from a freshly placed card to what is already on the table. */
export function autoLink(api: LedgerApi, node: TableNode, extra: WantedEdge[] = []): void {
  const p = autoLinkPatch(api.ledger, node, extra);
  if (Object.keys(p).length) api.update(p);
}

/**
 * Connect two cards. Returns the id of the edge to open for labelling: an existing edge with
 * the same direction, or the one just created. `null` when from === to.
 */
export function connectEdge(api: LedgerApi, from: string, to: string, fromSide?: Side, toSide?: Side): string | null {
  if (from === to) return null;
  const existing = Object.values(api.ledger.edges).find((e) => e.from === from && e.to === to);
  if (existing) return existing.id;
  const [edge] = newEdgesFor(api.ledger, [{ from, to, label: '', fromSide, toSide }]);
  if (!edge) return null;
  api.update({ [`edges/${edge.id}`]: edge });
  return edge.id;
}

/** RELATED row action: add the entry beside the card (if needed) and link it with the book relationship. */
export function addRelated(api: LedgerApi, node: TableNode, item: RelatedItem): TableNode | undefined {
  const existing = nodeForEntry(api.ledger.nodes, item.kind, item.ref);
  if (existing) {
    const p = edgesPatch(newEdgesFor(api.ledger, [relationEdge(node, existing, item)]));
    if (Object.keys(p).length) api.update(p);
    return existing;
  }
  const added = addBookNode(api, item.kind, item.ref, placeAround(api, node));
  if (!added) return undefined;
  autoLink(api, added, [relationEdge(node, added, item)]);
  return added;
}

/** One patch that removes a card and every edge touching it. */
export function deleteNodePatch(ledger: Ledger, id: string): Patch {
  const p: Patch = { [`nodes/${id}`]: null };
  for (const e of Object.values(ledger.edges)) if (e.from === id || e.to === id) p[`edges/${e.id}`] = null;
  return p;
}

// ================================================================ the Book dialog

export const BOOK_TABS: { kind: BookKind; label: string }[] = [
  { kind: 'faction', label: 'FACTIONS' },
  { kind: 'npc', label: 'NPCS' },
  { kind: 'location', label: 'PLACES' },
  { kind: 'district', label: 'DISTRICTS' },
];

export const CATEGORY_SHORT: Record<string, string> = {
  underworld: 'UNDERWORLD',
  institutions: 'INSTITUTION',
  labor_and_trade: 'LABOR',
  fringe: 'FRINGE',
  special: 'SPECIAL',
  citizenry: 'CITIZENRY',
};
export const categoryShort = (c: string) => CATEGORY_SHORT[c] ?? c.toUpperCase();

export function bookChips(tab: BookKind): [string, string][] {
  if (tab === 'faction')
    return [
      ['underworld', 'UNDERWORLD'],
      ['institutions', 'INSTITUTIONS'],
      ['labor_and_trade', 'LABOR & TRADE'],
      ['fringe', 'FRINGE'],
    ];
  if (tab === 'npc')
    return [
      ['leaders', 'LEADERS'],
      ['friends', 'PLAYBOOK FRIENDS'],
      ['contacts', 'CREW CONTACTS'],
      ['vice', 'VICE PURVEYORS'],
    ];
  if (tab === 'location') return [['city', 'CITY'], ...book.districts.map((d): [string, string] => [d.id, d.name.toUpperCase()])];
  return [];
}

export interface BookRow {
  kind: BookKind;
  ref: string;
  name: string;
  c1: string;
  c2: string;
  c3: string;
  /** The card already carrying this entry, if any. */
  node?: TableNode;
}

const cut = (s: string | null | undefined, k: number) => {
  const t = String(s ?? '').replace(/\s+/g, ' ');
  return t.length > k ? t.slice(0, k - 1) + '…' : t;
};

/** Rows for one tab of the Book, filtered by search text and chip. */
export function bookRows(nodes: Record<string, TableNode>, tab: BookKind, q: string, cat: string): BookRow[] {
  const query = q.toLowerCase().trim();
  const has = (s: string | null | undefined) => !query || String(s ?? '').toLowerCase().includes(query);
  const names = (ids: string[], k: BookKind) => ids.map((id) => bookEntry(k, id)?.entry.name ?? '').filter(Boolean);
  let rows: Omit<BookRow, 'node'>[] = [];
  if (tab === 'faction') {
    rows = book.factions
      .filter((f) => f.id !== 'citizenry' && (!cat || f.category === cat) && (has(f.name) || has(f.summary) || has(f.category)))
      .map((f) => ({
        kind: tab,
        ref: f.id,
        name: f.name,
        c1: categoryShort(f.category),
        c2: `T ${roman(f.tier)}${f.hold ? ` · ${f.hold.toUpperCase()}` : ''}`,
        c3: cut(f.summary, 110),
      }));
  } else if (tab === 'npc') {
    rows = book.npcs
      .filter((p) => {
        const rs = p.roles.join(' ');
        if (cat === 'leaders' && !isLeadRole(rs)) return false;
        if (cat === 'friends' && !p.playbook_friend_of.length) return false;
        if (cat === 'contacts' && !p.crew_contact_of.length) return false;
        if (cat === 'vice' && !p.vices_purveyed.length) return false;
        return (
          has(p.name) ||
          has(rs) ||
          has(p.traits.join(' ')) ||
          has(names(p.faction_ids, 'faction').join(' ')) ||
          has(p.aliases.join(' ')) ||
          has(names(p.district_ids, 'district').join(' '))
        );
      })
      .map((p) => ({
        kind: tab,
        ref: p.id,
        name: p.name,
        c1: cut(p.roles[0] ?? '', 26),
        c2: cut(names(p.faction_ids, 'faction').join(', ') || names(p.district_ids, 'district').join(', '), 26),
        c3: cut(p.traits.join(', '), 70),
      }));
  } else if (tab === 'location') {
    rows = book.locations
      .filter((l) => {
        const dn = l.district_id ? bookEntry('district', l.district_id)?.entry.name : '';
        return (!cat || (cat === 'city' ? !l.district_id : l.district_id === cat)) && (has(l.name) || has(l.type) || has(l.description) || has(dn));
      })
      .map((l) => ({
        kind: tab,
        ref: l.id,
        name: l.name,
        c1: cut(placeType(l.type), 22),
        c2: (l.district_id && bookEntry('district', l.district_id)?.entry.name) || 'City',
        c3: cut(l.description, 110),
      }));
  } else {
    rows = book.districts
      .filter((d) => has(d.name) || has(d.summary))
      .map((d) => {
        const tr = d.traits;
        return {
          kind: tab,
          ref: d.id,
          name: d.name,
          c1: `p. ${d.page}`,
          c2: `W${tr.wealth} S${tr.security_safety} C${tr.criminal_influence} O${tr.occult_influence}`,
          c3: cut(d.summary, 110),
        };
      });
  }
  return rows.map((r) => ({ ...r, node: nodeForEntry(nodes, r.kind, r.ref) }));
}
