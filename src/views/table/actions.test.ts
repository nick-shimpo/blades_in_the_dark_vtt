import { describe, expect, it } from 'vitest';
import { book } from '../../data';
import { blankLedger } from '../../ledger/normalize';
import type { Ledger, TableNode } from '../../ledger/types';
import { applyPatch, type Patch } from '../../sync';
import type { LedgerApi } from '../../ui/context';
import * as A from './actions';

/** A minimal LedgerApi over an in-memory ledger: patches apply immediately. */
function fakeApi(ledger: Ledger = blankLedger('Test')): LedgerApi & { patches: Patch[] } {
  const api = {
    ledger,
    patches: [] as Patch[],
    update(p: Patch) {
      api.patches.push(p);
      api.ledger = applyPatch(api.ledger, p);
    },
  } as unknown as LedgerApi & { patches: Patch[] };
  return api;
}

const factionWithLeader = () => book.factions.find((f) => f.detail && f.npc_ids.length && f.detail.npcs.some((n) => /leader/i.test(n.role)))!;

describe('relatedOf', () => {
  it('lists nothing for a card that is not from the book', () => {
    const api = fakeApi();
    const n = A.addCustomNode(api, 'faction', 'My gang');
    expect(A.relatedOf(n)).toEqual([]);
  });
  it('links a faction to its people (Leads / Member), allies, enemies and turf', () => {
    const fa = factionWithLeader();
    const api = fakeApi();
    const n = A.addBookNode(api, 'faction', fa.id)!;
    const rel = A.relatedOf(n);
    expect(rel.length).toBeGreaterThan(0);
    const leader = fa.detail!.npcs.find((x) => /leader/i.test(x.role))!;
    const leaderRow = rel.find((r) => r.kind === 'npc' && r.name.toLowerCase() === leader.name.toLowerCase());
    if (leaderRow) {
      expect(leaderRow.label).toBe('Leads');
      expect(leaderRow.from).toBe('other');
    }
    for (const r of rel) {
      if (r.kind === 'npc') expect(['Leads', 'Member']).toContain(r.label);
      if (r.kind === 'location') expect(r.label).toBe('Holds');
      if (r.kind === 'faction') expect(['Allied', 'Hostile']).toContain(r.label);
    }
    // no duplicates, never itself
    const keys = rel.map((r) => `${r.kind}:${r.ref}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).not.toContain(`faction:${fa.id}`);
  });
  it('links an npc to its factions and districts, a place to its district', () => {
    const npc = book.npcs.find((p) => p.faction_ids.length && p.district_ids.length)!;
    const api = fakeApi();
    const n = A.addBookNode(api, 'npc', npc.id)!;
    const rel = A.relatedOf(n);
    expect(rel.some((r) => r.kind === 'faction' && r.ref === npc.faction_ids[0] && r.from === 'self')).toBe(true);
    expect(rel.some((r) => r.kind === 'district' && r.ref === npc.district_ids[0] && r.label === 'Based in')).toBe(true);
    const loc = book.locations.find((l) => l.district_id)!;
    const ln = A.addBookNode(api, 'location', loc.id)!;
    expect(A.relatedOf(ln).some((r) => r.kind === 'district' && r.ref === loc.district_id && r.label === 'In' && r.from === 'self')).toBe(true);
  });
  it('a district lists the factions contesting it from the underworld conflicts', () => {
    const api = fakeApi();
    const d = A.addBookNode(api, 'district', 'crows-foot')!;
    const rel = A.relatedOf(d);
    expect(rel.some((r) => r.kind === 'faction' && r.ref === 'crows' && r.label === 'Contests')).toBe(true);
  });
});

describe('autoLink and edges', () => {
  it('draws structural relations to cards already on the table, once, in the book direction', () => {
    const npc = book.npcs.find((p) => p.faction_ids.length)!;
    const api = fakeApi();
    const fa = A.addBookNode(api, 'faction', npc.faction_ids[0])!;
    const n = A.addBookNode(api, 'npc', npc.id)!;
    A.autoLink(api, n);
    const edges = Object.values(api.ledger.edges);
    const link = edges.filter((e) => e.from === n.id && e.to === fa.id);
    expect(link.length).toBe(1);
    expect(['Leads', 'Member']).toContain(link[0].label);
    // running it again adds nothing
    A.autoLink(api, n);
    expect(Object.values(api.ledger.edges).length).toBe(edges.length);
  });
  it('does not auto-draw allies / enemies (not structural)', () => {
    const fa = book.factions.find((f) => f.detail?.allies.some((a) => a.faction_id))!;
    const ally = fa.detail!.allies.find((a) => a.faction_id)!.faction_id!;
    const api = fakeApi();
    A.addBookNode(api, 'faction', ally);
    const n = A.addBookNode(api, 'faction', fa.id)!;
    A.autoLink(api, n);
    expect(Object.values(api.ledger.edges).some((e) => e.label === 'Allied')).toBe(false);
  });
  it('connectEdge creates one edge per direction and returns the existing one afterwards', () => {
    const api = fakeApi();
    const a = A.addCustomNode(api, 'npc', 'A');
    const b = A.addCustomNode(api, 'npc', 'B');
    const e1 = A.connectEdge(api, a.id, b.id, 'e', 'w')!;
    expect(api.ledger.edges[e1]).toMatchObject({ from: a.id, to: b.id, label: '', fromSide: 'e', toSide: 'w' });
    expect(A.connectEdge(api, a.id, b.id)).toBe(e1);
    const e2 = A.connectEdge(api, b.id, a.id)!;
    expect(e2).not.toBe(e1);
    expect(Object.keys(api.ledger.edges).length).toBe(2);
    expect(A.connectEdge(api, a.id, a.id)).toBeNull();
  });
  it('addRelated places the entry beside the source and links it with the book label', () => {
    const npc = book.npcs.find((p) => p.faction_ids.length)!;
    const api = fakeApi();
    const fa = A.addBookNode(api, 'faction', npc.faction_ids[0])!;
    const item = A.relatedOf(fa).find((r) => r.kind === 'npc' && r.ref === npc.id)!;
    const added = A.addRelated(api, fa, item)!;
    expect(added.ref).toBe(npc.id);
    expect(Math.hypot(added.x - fa.x, added.y - fa.y)).toBeGreaterThan(200);
    const e = Object.values(api.ledger.edges).find((x) => x.from === added.id && x.to === fa.id);
    expect(e?.label).toBe(item.label);
    // second time: just links (already linked -> nothing new)
    const before = Object.keys(api.ledger.edges).length;
    expect(A.addRelated(api, fa, item)?.id).toBe(added.id);
    expect(Object.keys(api.ledger.edges).length).toBe(before);
  });
  it('deleteNodePatch removes the card and every edge touching it in one patch', () => {
    const api = fakeApi();
    const a = A.addCustomNode(api, 'npc', 'A');
    const b = A.addCustomNode(api, 'npc', 'B');
    const c = A.addCustomNode(api, 'npc', 'C');
    A.connectEdge(api, a.id, b.id);
    A.connectEdge(api, c.id, a.id);
    A.connectEdge(api, b.id, c.id);
    const p = A.deleteNodePatch(api.ledger, a.id);
    expect(Object.keys(p).length).toBe(3);
    const after = applyPatch(api.ledger, p);
    expect(after.nodes[a.id]).toBeUndefined();
    expect(Object.values(after.edges).length).toBe(1);
    expect(Object.values(after.edges)[0]).toMatchObject({ from: b.id, to: c.id });
  });
});

describe('the Book', () => {
  it('rows know which entries are already on the table', () => {
    const api = fakeApi();
    const n = A.addBookNode(api, 'faction', 'crows')!;
    const rows = A.bookRows(api.ledger.nodes, 'faction', 'crow', '');
    const crows = rows.find((r) => r.ref === 'crows')!;
    expect(crows.node?.id).toBe(n.id);
    expect(rows.every((r) => r.ref !== 'citizenry')).toBe(true);
  });
  it('chips filter npcs by role class and places by district', () => {
    const leaders = A.bookRows({}, 'npc', '', 'leaders');
    expect(leaders.length).toBeGreaterThan(0);
    expect(leaders.every((r) => A.isLeadRole(book.npcs.find((p) => p.id === r.ref)!.roles.join(' ')))).toBe(true);
    const cf = A.bookRows({}, 'location', '', 'crows-foot');
    expect(cf.length).toBeGreaterThan(0);
    expect(cf.every((r) => book.locations.find((l) => l.id === r.ref)!.district_id === 'crows-foot')).toBe(true);
    expect(A.bookChips('location')[0]).toEqual(['city', 'CITY']);
    expect(A.bookChips('district')).toEqual([]);
  });
});

describe('schema fields', () => {
  it('reads the prototype key names as fallbacks and keeps them in step on write', () => {
    const node = { f: { ltype: 'tavern' } } as unknown as TableNode;
    const field = A.SCHEMA.location.find((f) => f.key === 'kind')!;
    expect(A.readField(node, field)).toBe('tavern');
    const f = A.writeField(node, field, 'gambling den');
    expect(f).toEqual({ kind: 'gambling den', ltype: 'gambling den' });
  });
});
