/**
 * Blank documents, defaults, and conversion between the app's v2 ledger (id-keyed maps)
 * and the prototype's v1 file (arrays). `normalizeLedger` is deliberately forgiving: it is
 * run on every remote snapshot too, because Firebase drops empty objects and arrays and
 * may hand arrays back as index-keyed objects.
 */
import { playbook, type PlaybookId } from '../data';
import { newId } from './ids';
import type {
  CharacterSheet,
  Clock,
  Cohort,
  CrewSheet,
  Edge,
  EdgeV1,
  HarmRows,
  Ledger,
  LedgerFileV1,
  NodeType,
  Relation,
  TableNode,
} from './types';

// ---------------------------------------------------------------- small coercions

const str = (x: unknown, d = ''): string => (typeof x === 'string' ? x : x == null ? d : String(x));
const num = (x: unknown, d = 0): number => {
  const n = typeof x === 'number' ? x : Number(x);
  return Number.isFinite(n) ? n : d;
};
const bool = (x: unknown): boolean => x === true || x === 'true' || x === 1;
const obj = (x: unknown): Record<string, unknown> =>
  x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};

/** Accepts an array, an id-keyed map, or an index-keyed object (what Firebase returns for arrays). */
export function asList<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x.filter((v) => v != null) as T[];
  if (x && typeof x === 'object') return Object.values(x as Record<string, T>).filter((v) => v != null);
  return [];
}

function strList(x: unknown): string[] {
  return asList<unknown>(x).map((v) => str(v)).filter((v) => v !== '');
}

function keyById<T extends { id: string }>(xs: T[]): Record<string, T> {
  const out: Record<string, T> = {};
  for (const x of xs) out[x.id] = x;
  return out;
}

function boolMap(x: unknown): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(obj(x))) if (bool(v)) out[k] = true;
  return out;
}
function numMap(x: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj(x))) {
    const n = num(v, 0);
    if (n > 0) out[k] = n;
  }
  return out;
}
function relMap(x: unknown): Record<string, Relation> {
  const out: Record<string, Relation> = {};
  for (const [k, v] of Object.entries(obj(x))) {
    if (v === 'friend' || v === 'rival') out[k] = v;
  }
  return out;
}
function strMap(x: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj(x))) out[k] = str(v);
  return out;
}

const NODE_TYPES: NodeType[] = ['crew', 'faction', 'npc', 'location', 'district', 'org', 'other'];
const PLAYBOOK_IDS: PlaybookId[] = ['cutter', 'hound', 'leech', 'lurk', 'slide', 'spider', 'whisper'];
const CREW_IDS = ['assassins', 'bravos', 'cult', 'hawkers', 'shadows', 'smugglers'];

// ---------------------------------------------------------------- blanks

export function blankCrewSheet(): CrewSheet {
  return {
    type: null,
    reputation: '',
    lair: '',
    lairDistrict: '',
    groundsDistrict: '',
    operation: '',
    deity: '',
    rep: 0,
    tier: 0,
    hold: 'weak',
    heat: 0,
    wanted: 0,
    coin: 2,
    xp: 0,
    advances: 0,
    abilities: {},
    upgrades: {},
    cohorts: {},
    claims: {},
    contacts: {},
  };
}

export function blankHarm(): HarmRows {
  return { '3': [''], '2': ['', ''], '1': ['', ''] };
}

export function blankCharacter(pb: PlaybookId, id = newId('ch')): CharacterSheet {
  const start = playbook(pb)?.start ?? {};
  return {
    id,
    playbook: pb,
    name: '',
    alias: '',
    look: '',
    heritage: '',
    heritageDetail: '',
    background: '',
    backgroundDetail: '',
    vice: '',
    viceDetail: '',
    stress: 0,
    trauma: 0,
    traumaConds: [],
    harm: blankHarm(),
    healing: 0,
    armor: {},
    abilities: {},
    veteran: [],
    xp: {},
    advances: {},
    actions: { ...start },
    load: 'normal',
    items: {},
    coin: 0,
    stash: 0,
    friends: {},
    createdAt: Date.now(),
  };
}

export function blankCrewNode(name: string): TableNode {
  return {
    id: 'n_crew',
    type: 'crew',
    name,
    x: 2000,
    y: 1500,
    tier: '0',
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
  };
}

export function blankLedger(crewName = 'Unnamed Crew'): Ledger {
  const crewNode = blankCrewNode(crewName);
  return {
    v: 2,
    crew: { name: crewName, meta: '' },
    nodes: { [crewNode.id]: crewNode },
    edges: {},
    sheets: { crew: blankCrewSheet(), chars: {} },
  };
}

// ---------------------------------------------------------------- normalize pieces

export function normalizeClock(raw: unknown, fallbackId?: string): Clock | null {
  const c = obj(raw);
  const id = str(c.id, fallbackId ?? '');
  if (!id) return null;
  const size = num(c.size, 6);
  return {
    id,
    name: str(c.name, 'New clock'),
    size: [4, 6, 8, 10, 12].includes(size) ? size : 6,
    filled: Math.max(0, Math.min(size, num(c.filled, 0))),
  };
}

export function normalizeNode(raw: unknown): TableNode | null {
  const n = obj(raw);
  const id = str(n.id);
  if (!id) return null;
  const type = NODE_TYPES.includes(n.type as NodeType) ? (n.type as NodeType) : 'other';
  const clocks: Record<string, Clock> = {};
  const clockList = Array.isArray(n.clocks)
    ? (n.clocks as unknown[]).map((c, i) => normalizeClock(c, `c${i}`))
    : Object.entries(obj(n.clocks)).map(([k, c]) => normalizeClock(c, k));
  for (const c of clockList) if (c) clocks[c.id] = c;
  const node: TableNode = {
    id,
    type,
    name: str(n.name, 'Unnamed'),
    x: num(n.x, 2000),
    y: num(n.y, 1500),
    tier: str(n.tier),
    district: str(n.district),
    status: Math.max(-3, Math.min(3, Math.round(num(n.status, 0)))),
    blurb: str(n.blurb),
    wants: str(n.wants),
    details: str(n.details),
    moves: str(n.moves),
    notes: str(n.notes),
    f: strMap(n.f),
    clocks,
  };
  if (typeof n.ref === 'string' && n.ref) node.ref = n.ref;
  if (n.page != null) node.page = num(n.page);
  if (n.bookClocksSeeded) node.bookClocksSeeded = true;
  if (n.createdAt != null) node.createdAt = num(n.createdAt);
  return node;
}

/** One v1/v2 edge record → one or two one-way edges (legacy `dir` 2 reverses, 3 duplicates). */
export function normalizeEdge(raw: unknown): Edge[] {
  const e = obj(raw) as Partial<EdgeV1>;
  const id = str(e.id);
  const from = str(e.from);
  const to = str(e.to);
  if (!id || !from || !to) return [];
  const base = (f: string, t: string, i: string): Edge => {
    const out: Edge = { id: i, from: f, to: t, label: str(e.label) };
    if (e.note) out.note = str(e.note);
    if (e.fromSide) out.fromSide = e.fromSide;
    if (e.toSide) out.toSide = e.toSide;
    return out;
  };
  const dir = e.dir;
  if (dir === 2) return [base(to, from, id)];
  if (dir === 3) return [base(from, to, id), base(to, from, `${id}r`)];
  return [base(from, to, id)];
}

export function normalizeCohort(raw: unknown, fallbackId?: string): Cohort | null {
  const c = obj(raw);
  const id = str(c.id, fallbackId ?? '');
  if (!id) return null;
  const harm = Math.max(0, Math.min(4, Math.round(num(c.harm, 0)))) as Cohort['harm'];
  return {
    id,
    kind: c.kind === 'expert' ? 'expert' : 'gang',
    name: str(c.name),
    types: strList(c.types).slice(0, 2),
    expertType: str(c.expertType),
    edges: strList(c.edges).slice(0, 2),
    flaws: strList(c.flaws).slice(0, 2),
    harm,
    armor: bool(c.armor),
  };
}

export function normalizeCrewSheet(raw: unknown): CrewSheet {
  const c = obj(raw);
  const blank = blankCrewSheet();
  const cohorts: Record<string, Cohort> = {};
  const list = Array.isArray(c.cohorts)
    ? (c.cohorts as unknown[]).map((x, i) => normalizeCohort(x, `co${i}`))
    : Object.entries(obj(c.cohorts)).map(([k, x]) => normalizeCohort(x, k));
  for (const co of list) if (co) cohorts[co.id] = co;
  const type = CREW_IDS.includes(str(c.type)) ? (str(c.type) as CrewSheet['type']) : null;
  return {
    type,
    reputation: str(c.reputation),
    lair: str(c.lair),
    lairDistrict: str(c.lairDistrict),
    groundsDistrict: str(c.groundsDistrict),
    operation: str(c.operation),
    deity: str(c.deity),
    rep: Math.max(0, Math.min(12, num(c.rep, 0))),
    tier: Math.max(0, Math.min(6, num(c.tier, 0))),
    hold: c.hold === 'strong' ? 'strong' : 'weak',
    heat: Math.max(0, Math.min(8, num(c.heat, 0))),
    wanted: Math.max(0, Math.min(4, num(c.wanted, 0))),
    coin: Math.max(0, Math.min(16, num(c.coin, blank.coin))),
    xp: Math.max(0, Math.min(7, num(c.xp, 0))),
    advances: Math.max(0, num(c.advances, 0)),
    abilities: boolMap(c.abilities),
    upgrades: numMap(c.upgrades),
    cohorts,
    claims: boolMap(c.claims),
    contacts: relMap(c.contacts),
  };
}

function normalizeHarm(raw: unknown): HarmRows {
  const h = obj(raw);
  const row = (k: '1' | '2' | '3', n: number): string[] => {
    const cells = asList<unknown>(h[k]).map((v) => str(v));
    while (cells.length < n) cells.push('');
    return cells.slice(0, n);
  };
  // Firebase drops empty strings inside arrays? No, but it drops empty arrays; rows come back sparse.
  const r3 = row('3', 1) as [string];
  const r2 = row('2', 2) as [string, string];
  const r1 = row('1', 2) as [string, string];
  return { '3': r3, '2': r2, '1': r1 };
}

export function normalizeCharacter(raw: unknown): CharacterSheet | null {
  const c = obj(raw);
  const id = str(c.id);
  if (!id) return null;
  const pb = PLAYBOOK_IDS.includes(str(c.playbook) as PlaybookId) ? (str(c.playbook) as PlaybookId) : 'cutter';
  const blank = blankCharacter(pb, id);
  const actions: CharacterSheet['actions'] = {};
  for (const [k, v] of Object.entries(obj(c.actions))) {
    const n = Math.max(0, Math.min(5, Math.round(num(v, 0))));
    if (n > 0) (actions as Record<string, number>)[k] = n;
  }
  const trackNums = (x: unknown): CharacterSheet['xp'] => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(obj(x))) {
      const n = Math.max(0, num(v, 0));
      if (n > 0) out[k] = n;
    }
    return out as CharacterSheet['xp'];
  };
  const veteran = asList<unknown>(c.veteran)
    .map((v) => obj(v))
    .filter((v) => PLAYBOOK_IDS.includes(str(v.pb) as PlaybookId) && str(v.id))
    .map((v) => ({ pb: str(v.pb) as PlaybookId, id: str(v.id) }));
  const armorRaw = obj(c.armor);
  const armor: CharacterSheet['armor'] = {};
  if (bool(armorRaw.armor)) armor.armor = true;
  if (bool(armorRaw.heavy)) armor.heavy = true;
  if (bool(armorRaw.special)) armor.special = true;
  const load = c.load === 'light' || c.load === 'heavy' ? c.load : 'normal';
  return {
    ...blank,
    name: str(c.name),
    alias: str(c.alias),
    look: str(c.look),
    heritage: str(c.heritage),
    heritageDetail: str(c.heritageDetail),
    background: str(c.background),
    backgroundDetail: str(c.backgroundDetail),
    vice: str(c.vice),
    viceDetail: str(c.viceDetail),
    stress: Math.max(0, Math.min(12, num(c.stress, 0))),
    trauma: Math.max(0, Math.min(5, num(c.trauma, 0))),
    traumaConds: strList(c.traumaConds),
    harm: normalizeHarm(c.harm),
    healing: Math.max(0, Math.min(3, num(c.healing, 0))),
    armor,
    abilities: boolMap(c.abilities),
    veteran,
    xp: trackNums(c.xp),
    advances: trackNums(c.advances),
    actions: Object.keys(actions).length ? actions : { ...blank.actions },
    load,
    items: boolMap(c.items),
    coin: Math.max(0, Math.min(4, num(c.coin, 0))),
    stash: Math.max(0, Math.min(40, num(c.stash, 0))),
    friends: relMap(c.friends),
    createdAt: num(c.createdAt, 0) || (/^ch(\d{10,})$/.test(id) ? Number(id.slice(2)) : Date.now()),
  };
}

// ---------------------------------------------------------------- whole ledger

export function isLedgerLike(x: unknown): boolean {
  const o = obj(x);
  return !!o.crew && (Array.isArray(o.nodes) || (typeof o.nodes === 'object' && o.nodes !== null));
}

/** Any v1 file, v2 document or Firebase snapshot → a complete v2 ledger. */
export function normalizeLedger(raw: unknown): Ledger {
  const r = obj(raw);
  const crewRaw = obj(r.crew);
  const crewName = str(crewRaw.name, 'Unnamed Crew');

  const nodes: Record<string, TableNode> = {};
  for (const n of asList<unknown>(r.nodes)) {
    const node = normalizeNode(n);
    if (node) nodes[node.id] = node;
  }
  if (!Object.values(nodes).some((n) => n.type === 'crew')) {
    const cn = blankCrewNode(crewName);
    nodes[cn.id] = cn;
  }

  const edges: Record<string, Edge> = {};
  for (const e of asList<unknown>(r.edges)) {
    for (const edge of normalizeEdge(e)) {
      if (nodes[edge.from] && nodes[edge.to]) edges[edge.id] = edge;
    }
  }

  const sheetsRaw = obj(r.sheets);
  const chars: Record<string, CharacterSheet> = {};
  for (const c of asList<unknown>(sheetsRaw.chars)) {
    const ch = normalizeCharacter(c);
    if (ch) chars[ch.id] = ch;
  }

  const ledger: Ledger = {
    v: 2,
    crew: { name: crewName, meta: str(crewRaw.meta) },
    nodes,
    edges,
    sheets: { crew: normalizeCrewSheet(sheetsRaw.crew), chars },
  };
  if (typeof r.savedAt === 'string') ledger.savedAt = r.savedAt;
  return ledger;
}

/** Parse pasted / imported text (or an already-parsed object). Returns null if it is not a ledger. */
export function importLedger(input: string | unknown): Ledger | null {
  let parsed: unknown = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (!isLedgerLike(parsed)) return null;
  return normalizeLedger(parsed);
}

/** v2 → the prototype's v1 file, so exports open in the prototype and in older tools. */
export function exportLedger(ledger: Ledger): LedgerFileV1 {
  const nodes = Object.values(ledger.nodes).map((n) => ({ ...n, clocks: Object.values(n.clocks) }));
  const edges = Object.values(ledger.edges).map((e) => ({ ...e }));
  const chars = Object.values(ledger.sheets.chars)
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt);
  const crew = { ...ledger.sheets.crew, cohorts: Object.values(ledger.sheets.crew.cohorts) };
  let seq = 0;
  for (const id of [...Object.keys(ledger.nodes), ...Object.keys(ledger.edges)]) {
    const m = /^[ne](\d+)$/.exec(id);
    if (m) seq = Math.max(seq, Number(m[1]));
  }
  return {
    app: 'bitd-gm-cockpit',
    v: 1,
    savedAt: new Date().toISOString(),
    seq: Math.max(seq + 1, nodes.length + edges.length + 1),
    crew: { name: ledger.crew.name, meta: ledger.crew.meta },
    nodes,
    edges,
    sheets: { crew, chars },
  };
}

/** Characters in a stable display order (creation order). */
export function charactersInOrder(ledger: Ledger): CharacterSheet[] {
  return Object.values(ledger.sheets.chars).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export function crewNode(ledger: Ledger): TableNode | undefined {
  return Object.values(ledger.nodes).find((n) => n.type === 'crew');
}
