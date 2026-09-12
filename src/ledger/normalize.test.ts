import { describe, expect, it } from 'vitest';
import example from './ledger.example.v1.json';
import { blankLedger, exportLedger, importLedger, normalizeLedger } from './normalize';

describe('import of the prototype ledger file', () => {
  it('converts arrays to id-keyed maps and keeps every value', () => {
    const l = importLedger(JSON.stringify(example));
    expect(l).not.toBeNull();
    expect(l!.v).toBe(2);
    expect(Object.keys(l!.nodes)).toEqual(['n1', 'n2', 'n5']);
    expect(Object.keys(l!.edges)).toEqual(['e1', 'e4']);
    expect(l!.nodes.n2.clocks.c1).toMatchObject({ name: 'Find the thieves', size: 6, filled: 2 });
    expect(l!.nodes.n2.bookClocksSeeded).toBe(true);
    expect(l!.sheets.crew).toMatchObject({ type: 'shadows', rep: 3, hold: 'weak', claims: { '1,1': true }, contacts: { Rigney: 'friend' } });
    const ch = l!.sheets.chars.ch1;
    expect(ch).toMatchObject({ playbook: 'lurk', name: 'Cross', stress: 3, load: 'light' });
    expect(ch.harm['1']).toEqual(['Battered', '']);
    expect(ch.actions).toMatchObject({ prowl: 2, finesse: 1, survey: 2, tinker: 1, skirmish: 1 });
  });
  it('migrates legacy two-way edges', () => {
    const l = normalizeLedger({
      crew: { name: 'x' },
      nodes: [
        { id: 'a', type: 'faction', name: 'A' },
        { id: 'b', type: 'npc', name: 'B' },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', label: 'x', dir: 2 },
        { id: 'e2', from: 'a', to: 'b', label: 'y', dir: 3 },
      ],
    });
    expect(l.edges.e1).toMatchObject({ from: 'b', to: 'a' });
    expect(l.edges.e2).toMatchObject({ from: 'a', to: 'b' });
    expect(l.edges.e2r).toMatchObject({ from: 'b', to: 'a' });
  });
  it('rejects things that are not ledgers', () => {
    expect(importLedger('not json')).toBeNull();
    expect(importLedger('{"foo":1}')).toBeNull();
    expect(importLedger(JSON.stringify({ crew: { name: 'x' } }))).toBeNull();
  });
  it('fills defaults for sparse Firebase snapshots (missing collections, index-keyed arrays)', () => {
    const l = normalizeLedger({
      crew: { name: 'Sparse' },
      nodes: { n_crew: { id: 'n_crew', type: 'crew', name: 'Sparse', clocks: { '0': { id: 'k', name: 'q', size: 4, filled: 1 } } } },
      sheets: { chars: { ch_a: { id: 'ch_a', playbook: 'whisper', harm: { '1': { '1': 'Drained' } }, traumaConds: { '0': 'Cold' } } } },
    });
    expect(l.edges).toEqual({});
    expect(l.nodes.n_crew.clocks.k.filled).toBe(1);
    const ch = l.sheets.chars.ch_a;
    expect(ch.harm['1']).toEqual(['Drained', '']);
    expect(ch.harm['3']).toEqual(['']);
    expect(ch.traumaConds).toEqual(['Cold']);
    expect(ch.actions).toEqual({ attune: 2, study: 1 });
    expect(l.sheets.crew.type).toBeNull();
  });
  it('adds a crew card when none exists', () => {
    const l = normalizeLedger({ crew: { name: 'Nobody' }, nodes: [] });
    expect(Object.values(l.nodes).some((n) => n.type === 'crew' && n.name === 'Nobody')).toBe(true);
  });
});

describe('export', () => {
  it('round-trips to the v1 array shape the prototype reads', () => {
    const l = importLedger(JSON.stringify(example))!;
    const out = exportLedger(l);
    expect(out.app).toBe('bitd-gm-cockpit');
    expect(out.v).toBe(1);
    expect(Array.isArray(out.nodes)).toBe(true);
    expect(Array.isArray(out.nodes[1].clocks)).toBe(true);
    expect(Array.isArray(out.sheets!.chars)).toBe(true);
    expect(Array.isArray(out.sheets!.crew.cohorts)).toBe(true);
    expect(out.seq).toBeGreaterThan(5);
    // and importing our export gives the same document back
    const again = importLedger(JSON.stringify(out))!;
    expect(again.nodes).toEqual(l.nodes);
    expect(again.edges).toEqual(l.edges);
    expect(again.sheets).toEqual(l.sheets);
  });
  it('blank ledger has a crew card and an empty crew sheet', () => {
    const l = blankLedger('The Widow’s Lantern');
    expect(l.nodes.n_crew.type).toBe('crew');
    expect(l.sheets.crew.coin).toBe(2);
    expect(exportLedger(l).nodes[0].clocks).toEqual([]);
  });
});
