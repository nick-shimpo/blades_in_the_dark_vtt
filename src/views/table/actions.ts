/**
 * Table actions that other views (Sparks) call to put things on the Table.
 * The Table view owns this file and may extend it; keep the exported signatures stable.
 */
import { bookEntry, type BookKind, type Faction } from '../../data';
import { newId } from '../../ledger/ids';
import { roman } from '../../data';
import type { Clock, NodeType, TableNode } from '../../ledger/types';
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
