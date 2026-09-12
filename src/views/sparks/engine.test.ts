import { describe, expect, it } from 'vitest';
import { sparks } from '../../data';
import {
  catShort,
  districtSub,
  filteredFactions,
  finderFactions,
  genNameStr,
  rollIndex,
  rolledLabel,
  rollResult,
  sparkLine,
  tableById,
  tablesForGroup,
} from './engine';

const always = (v: number) => () => v;

describe('sparks engine', () => {
  it('has every table the engines roll', () => {
    for (const id of ['descriptor', 'action', 'object', 'motive', 'twist', 'scoretype', 'target', 'whynow', 'whycare', 'npcrole', 'npcwant', 'npcproblem', 'tell', 'district']) {
      expect(tableById.get(id), id).toBeDefined();
    }
  });

  it('rollIndex avoids repeating the previous index', () => {
    const items = ['a', 'b', 'c'];
    expect(rollIndex(items, undefined, always(0))).toBe(0);
    expect(rollIndex(items, 0, always(0))).toBe(1);
    expect(rollIndex(items, 2, always(0.99))).toBe(0);
    expect(rollIndex(['only'], 0, always(0))).toBe(0);
  });

  it('formats results and the spark line', () => {
    const descriptor = tableById.get('descriptor')!;
    expect(rollResult({ descriptor: 1 }, 'descriptor')).toBe(descriptor.items[1]);
    expect(rollResult({}, 'descriptor')).toBeNull();
    expect(rolledLabel({ descriptor: 4 }, 'descriptor')).toBe('[5]');
    expect(rolledLabel({}, 'descriptor')).toBe('');
    expect(sparkLine({ descriptor: 0, action: 0, object: 0 })).toBe('roll for a score seed…');
    const line = sparkLine({ descriptor: 0, action: 0, object: 0, motive: 0 });
    const a = tableById.get('action')!.items[0].toLowerCase();
    const o = tableById.get('object')!.items[0].toLowerCase();
    const m = tableById.get('motive')!.items[0].toLowerCase();
    expect(line).toBe(`${descriptor.items[0]} ${a} — a ${o}, for ${m}.`);
  });

  it('filters the faction roster without the citizenry', () => {
    expect(finderFactions.some((f) => f.id === 'citizenry')).toBe(false);
    expect(filteredFactions('', [])).toHaveLength(finderFactions.length);
    const underworld = filteredFactions('', ['underworld']);
    expect(underworld.length).toBeGreaterThan(0);
    expect(underworld.every((f) => f.category === 'underworld')).toBe(true);
    expect(filteredFactions('unseen', []).map((f) => f.id)).toContain('unseen');
    expect(filteredFactions('UNSEEN', ['institutions'])).toHaveLength(0);
  });

  it('shortens categories the way the prototype did', () => {
    expect(catShort('labor_and_trade')).toBe('LABOR');
    expect(catShort('institutions')).toBe('INSTITUTION');
    expect(catShort('odd')).toBe('ODD');
  });

  it('generates names in the three shapes', () => {
    const { first, family, alias } = sparks.names;
    expect(genNameStr('name', always(0))).toBe(`${first[0]} ${family[0]}`);
    expect(genNameStr('alias', always(0))).toBe(`“${alias[0]}”`);
    expect(genNameStr('full', always(0))).toBe(`${first[0]} “${alias[0]}” ${family[0]}`);
  });

  it('lists tables per group and district one-liners', () => {
    expect(tablesForGroup('factions')).toHaveLength(0);
    expect(tablesForGroup('playbooks')).toHaveLength(0);
    expect(tablesForGroup('generic').every((t) => t.group === 'generic')).toBe(true);
    expect(tablesForGroup('doskvol').some((t) => t.id === 'district')).toBe(true);
    const d = sparks.districts[0];
    expect(districtSub(d.n)).toBe(d.s);
    expect(districtSub('Nowhere')).toBeNull();
  });
});
