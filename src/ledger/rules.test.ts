import { describe, expect, it } from 'vitest';
import { claimsMaps } from '../data';
import { blankCharacter, blankCrewSheet } from './normalize';
import * as R from './rules';
import type { CharacterSheet, CrewSheet, TableNode } from './types';

const crew0 = (): CrewSheet => blankCrewSheet();
const lurk = (): CharacterSheet => blankCharacter('lurk', 'ch_test');

describe('attributes and actions', () => {
  it('attribute rating counts actions with at least one dot', () => {
    const ch = lurk(); // start: prowl 2, finesse 1
    expect(R.attrRating(ch, 'prowess')).toBe(2);
    expect(R.attrRating(ch, 'insight')).toBe(0);
    const ch2 = { ...ch, actions: { ...ch.actions, hunt: 1, study: 3, tinker: 1 } };
    expect(R.attrRating(ch2, 'insight')).toBe(3);
  });
  it('action cap is 3, or 4 with a fully bought Mastery upgrade', () => {
    expect(R.actionCap(crew0())).toBe(3);
    expect(R.actionCap({ ...crew0(), upgrades: { mastery: 3 } })).toBe(3);
    expect(R.actionCap({ ...crew0(), upgrades: { mastery: 4 } })).toBe(4);
  });
  it('setAction clamps to the cap and lowers when clicking the current rating', () => {
    const ch = lurk();
    expect(R.setAction(ch, crew0(), 'prowl', 4).actions.prowl).toBe(3);
    expect(R.setAction(ch, crew0(), 'prowl', 2).actions.prowl).toBe(1);
    expect(R.setAction(ch, crew0(), 'hunt', 1).actions.hunt).toBe(1);
  });
});

describe('stress and trauma', () => {
  it('stress max is 9, +1 Survivor, +1 crew Composed/Steady, capped at 12', () => {
    const ch = lurk();
    expect(R.stressMax(ch, crew0())).toBe(9);
    expect(R.stressMax({ ...ch, veteran: [{ pb: 'hound', id: 'survivor' }] }, crew0())).toBe(10);
    expect(R.stressMax(ch, { ...crew0(), upgrades: { steady: 3 } })).toBe(10);
    expect(R.stressMax(ch, { ...crew0(), upgrades: { steady: 2 } })).toBe(9);
    expect(R.stressMax({ ...ch, veteran: [{ pb: 'hound', id: 'survivor' }] }, { ...crew0(), upgrades: { composed: 3 } })).toBe(11);
  });
  it('marking the last stress box clears stress and adds a trauma', () => {
    const ch = { ...lurk(), stress: 8 };
    const r = R.addStress(ch, crew0(), 1);
    expect(r.trauma).toBe(true);
    expect(r.char.stress).toBe(0);
    expect(r.char.trauma).toBe(1);
  });
  it('stress never goes negative and trauma caps at the trauma max', () => {
    expect(R.addStress({ ...lurk(), stress: 1 }, crew0(), -5).char.stress).toBe(0);
    const r = R.addStress({ ...lurk(), stress: 8, trauma: 4 }, crew0(), 1);
    expect(r.char.trauma).toBe(4);
    expect(R.traumaMax({ ...crew0(), upgrades: { hardened: 3 } })).toBe(5);
  });
});

describe('harm and healing', () => {
  it('harm fills the first empty cell and cascades upward when a row is full', () => {
    let ch = lurk();
    ch = R.takeHarm(ch, 1, 'Battered').char;
    ch = R.takeHarm(ch, 1, 'Drained').char;
    expect(ch.harm['1']).toEqual(['Battered', 'Drained']);
    const up = R.takeHarm(ch, 1, 'Scared');
    expect(up.level).toBe(2);
    expect(up.char.harm['2'][0]).toBe('Scared');
  });
  it('a fourth level-3 harm is fatal and changes nothing', () => {
    const ch = { ...lurk(), harm: { '3': ['Impaled'] as [string], '2': ['a', 'b'] as [string, string], '1': ['c', 'd'] as [string, string] } };
    const r = R.takeHarm(ch, 3, 'Stabbed');
    expect(r.fatal).toBe(true);
    expect(r.char).toBe(ch);
    expect(R.isFatal(ch)).toBe(true);
  });
  it('recording harm clears the healing clock (to 1 with Vigorous)', () => {
    const ch = { ...lurk(), healing: 3 };
    expect(R.takeHarm(ch, 1, 'x').char.healing).toBe(0);
    const vig = { ...ch, veteran: [{ pb: 'cutter' as const, id: 'vigorous' }] };
    expect(R.takeHarm(vig, 1, 'x').char.healing).toBe(1);
  });
  it('filling the healing clock moves every injury down a level', () => {
    const ch = { ...lurk(), healing: 3, harm: { '3': ['Broken Leg'] as [string], '2': ['Cut', ''] as [string, string], '1': ['Battered', 'Drained'] as [string, string] } };
    const healed = R.healTick(ch);
    expect(healed.healing).toBe(0);
    expect(healed.harm['3']).toEqual(['']);
    expect(healed.harm['2']).toEqual(['Broken Leg', '']);
    expect(healed.harm['1']).toEqual(['Cut', '']);
  });
  it('Tough as Nails shifts the penalty labels', () => {
    const ch = { ...lurk(), veteran: [{ pb: 'hound' as const, id: 'tough_as_nails' }] };
    expect(R.harmPenalty(lurk(), 3)).toBe('NEED HELP');
    expect(R.harmPenalty(ch, 3)).toBe('−1D');
    expect(R.harmPenalty(ch, 1)).toBe('—');
  });
});

describe('armor, load, stash, xp', () => {
  it('special armor is only available with a qualifying ability', () => {
    expect(R.hasSpecialArmor(lurk())).toBe(false);
    expect(R.hasSpecialArmor({ ...lurk(), abilities: { shadow: true } })).toBe(true);
  });
  it('load limits and used load', () => {
    const ch = { ...lurk(), items: { fine_lockpicks: true, a_blade_or_two: true, climbing_gear: true } };
    expect(R.loadLimits(ch)).toEqual({ light: 3, normal: 5, heavy: 6, max: 8 });
    expect(R.loadUsed(ch)).toBe(3); // 0 + 1 + 2
    expect(R.loadLimits({ ...ch, veteran: [{ pb: 'cutter', id: 'mule' }] }).heavy).toBe(8);
  });
  it('lifestyle is full rows of stash; conversions respect the limits', () => {
    expect(R.lifestyle(19)).toBe(1);
    expect(R.lifestyle(40)).toBe(4);
    expect(R.stashToCoin({ ...lurk(), stash: 1 })).toBeNull();
    expect(R.stashToCoin({ ...lurk(), stash: 2, coin: 4 })).toBeNull();
    expect(R.stashToCoin({ ...lurk(), stash: 2, coin: 3 })).toMatchObject({ stash: 0, coin: 4 });
    expect(R.coinToStash({ ...lurk(), coin: 1, stash: 40 })).toBeNull();
  });
  it('xp tracks fill (8 playbook, 6 attribute) and grant advances with carry-over', () => {
    const a = R.addXp({ ...lurk(), xp: { playbook: 7 } }, 'playbook', 2);
    expect(a.advances).toBe(1);
    expect(a.char.xp.playbook).toBe(1);
    expect(a.char.advances.playbook).toBe(1);
    const b = R.setXp({ ...lurk(), xp: { prowess: 5 } }, 'prowess', 6);
    expect(b.char.advances.prowess).toBe(1);
    expect(b.char.xp.prowess).toBe(0);
    expect(R.spendAdvance(b.char, 'prowess').advances.prowess).toBe(0);
  });
});

describe('rolls', () => {
  it('pool adds one bonus die and one assist', () => {
    expect(R.rollPool(2)).toBe(2);
    expect(R.rollPool(2, { bonus: 'push', assist: true })).toBe(4);
    expect(R.rollPool(0, { bonus: 'bargain' })).toBe(1);
  });
  it('zero pool keeps the lowest of two dice and cannot crit', () => {
    const r = R.judge([6, 6], true);
    expect(r.highest).toBe(6);
    expect(r.result).toBe('success');
    expect(R.judge([6, 2], true).result).toBe('failure');
  });
  it('two sixes are a critical; highest die decides otherwise', () => {
    expect(R.judge([6, 6, 1], false).result).toBe('critical');
    expect(R.judge([6, 3], false).result).toBe('success');
    expect(R.judge([4, 3], false).result).toBe('partial');
    expect(R.judge([3, 1], false).result).toBe('failure');
  });
  it('rollDice uses the injected rng and respects the pool size', () => {
    const seq = [0.99, 0.99, 0.1];
    let i = 0;
    const r = R.rollDice(3, () => seq[i++]);
    expect(r.dice).toEqual([6, 6, 1]);
    expect(r.result).toBe('critical');
  });
  it('resistance stress is 6 minus highest, or clears 1 on a critical', () => {
    expect(R.resistanceStress(R.judge([4, 2], false))).toBe(2);
    expect(R.resistanceStress(R.judge([6, 6], false))).toBe(-1);
  });
  it('outcome text follows position and result', () => {
    expect(R.outcomeText('risky', 'success')).toBe('You do it.');
    expect(R.outcomeText('desperate', 'failure')).toMatch(/worst outcome/);
  });
});

describe('crew: rep, turf, heat, coin, xp', () => {
  const nodes = (statuses: number[]): Record<string, TableNode> =>
    Object.fromEntries(
      statuses.map((s, i) => [
        `n${i}`,
        { id: `n${i}`, type: 'faction', name: `f${i}`, x: 0, y: 0, tier: 'I', district: '', status: s, blurb: '', wants: '', details: '', moves: '', notes: '', f: {}, clocks: {} } as TableNode,
      ]),
    );
  it('turf counts held turf tiles, Fiends adds wanted, Accord adds up to three +3 factions, max 6', () => {
    const bravos = R.pickCrewType(crew0(), 'bravos');
    const withTurf = { ...bravos, claims: { '0,1': true, '1,1': true, '2,1': true } }; // turf, turf, bluecoat intimidation
    expect(R.turfCount(withTurf)).toBe(2);
    expect(R.turfCount({ ...withTurf, abilities: { fiends: true }, wanted: 3 })).toBe(5);
    const hawkers = { ...R.pickCrewType(crew0(), 'hawkers'), abilities: { accord: true } };
    expect(R.turfCount(hawkers, nodes([3, 3, 3, 3, 2]))).toBe(3);
    expect(R.turfCount({ ...withTurf, abilities: { fiends: true }, wanted: 4, claims: { ...withTurf.claims, '1,3': true, '1,4': true } })).toBe(6);
  });
  it('rep needed is 12 minus turf, never below 6; develop flips hold then buys tier', () => {
    const c = crew0();
    expect(R.repNeeded(c)).toBe(12);
    expect(R.canDevelop({ ...c, rep: 12 })).toBe(true);
    const strong = R.develop({ ...c, rep: 12 });
    expect(strong).toMatchObject({ hold: 'strong', rep: 0, tier: 0 });
    const up = R.develop({ ...strong, rep: 12 });
    expect(up).toMatchObject({ hold: 'weak', rep: 0, tier: 1 });
    expect(R.developCost({ ...c, tier: 1 })).toBe(16);
    expect(R.developCost({ ...c, tier: 1, abilities: { patron: true } })).toBe(8);
  });
  it('heat rolls into wanted at 9 with carry-over; wanted caps at 4', () => {
    expect(R.addHeat({ ...crew0(), heat: 7 }, 4)).toMatchObject({ heat: 2, wanted: 1 });
    expect(R.addHeat({ ...crew0(), heat: 8, wanted: 4 }, 1)).toMatchObject({ heat: 0, wanted: 4 });
    expect(R.setHeat({ ...crew0(), heat: 3 }, 1).heat).toBe(1);
  });
  it('coin capacity grows with the vault upgrade', () => {
    expect(R.coinCap(crew0())).toBe(4);
    expect(R.coinCap({ ...crew0(), upgrades: { vault: 1 } })).toBe(8);
    expect(R.coinCap({ ...crew0(), upgrades: { vault: 2 } })).toBe(16);
  });
  it('crew xp fills at 8 and grants an advance', () => {
    const r = R.addCrewXp({ ...crew0(), xp: 7 }, 1);
    expect(r.crew.xp).toBe(0);
    expect(r.crew.advances).toBe(1);
    expect(R.spendCrewAdvance(r.crew).advances).toBe(0);
  });
  it('upgrade boxes fill to the clicked box and lower on re-click', () => {
    const c = R.setUpgrade(crew0(), 'vault', 2, 2);
    expect(c.upgrades.vault).toBe(2);
    expect(R.setUpgrade(c, 'vault', 2, 2).upgrades.vault).toBe(1);
    expect(R.setUpgrade(c, 'vault', 2, 5).upgrades.vault).toBe(2);
  });
});

describe('crew: type, cohorts, claims', () => {
  it('picking a crew type pre-fills its starting upgrades and cohort', () => {
    const b = R.pickCrewType(crew0(), 'bravos');
    expect(b.upgrades).toEqual({ training_prowess: 1 });
    const cohorts = Object.values(b.cohorts);
    expect(cohorts).toHaveLength(1);
    expect(cohorts[0]).toMatchObject({ kind: 'gang', types: ['Thugs'] });
    expect(R.pickCrewType(crew0(), 'hawkers').upgrades).toEqual({ training_resolve: 1, secure_lair: 1 });
    expect(R.pickCrewType(crew0(), 'shadows').upgrades).toEqual({ training_prowess: 1, hidden_lair: 1 });
    expect(R.pickCrewType(crew0(), 'smugglers').upgrades).toEqual({ training_prowess: 1, boat_house: 1 });
    expect(R.pickCrewType(crew0(), 'assassins').upgrades).toEqual({ training_insight: 1, training_prowess: 1 });
  });
  it('cohort quality and scale follow tier; experts are +1 quality, scale 0; elite from upgrades; barracks adds scale', () => {
    const crew = { ...R.pickCrewType(crew0(), 'bravos'), tier: 2, upgrades: { elite_thugs: 1 }, claims: { '0,0': true } };
    const gang = R.newCohort('gang', ['Thugs']);
    expect(R.cohortStats(gang, crew)).toEqual({ quality: 2, scale: 3, elite: true });
    const expert = R.newCohort('expert');
    expect(R.cohortStats(expert, crew)).toEqual({ quality: 3, scale: 0, elite: false });
  });
  it('off-path detection follows the printed connectors', () => {
    const map = claimsMaps.bravos;
    const crew = R.pickCrewType(crew0(), 'bravos');
    // Terrorized Citizens (0,2) is connected to the lair (1,2); Informants (0,3) is NOT connected to (0,2).
    expect(R.offPathClaims({ ...crew, claims: { '0,2': true } }, map).size).toBe(0);
    expect(R.offPathClaims({ ...crew, claims: { '0,3': true } }, map)).toEqual(new Set(['0,3']));
    // Informants reached via Turf (1,3): lair → (1,3) → (0,3)
    expect(R.offPathClaims({ ...crew, claims: { '0,3': true, '1,3': true } }, map).size).toBe(0);
    expect(R.isConnected(map, [0, 2], [0, 3])).toBe(false);
    expect(R.isConnected(map, [1, 2], [0, 2])).toBe(true);
  });
  it('toggling a claim never touches the lair tile', () => {
    const map = claimsMaps.bravos;
    const crew = R.pickCrewType(crew0(), 'bravos');
    expect(R.toggleClaim(crew, map, 1, 2)).toBe(crew);
    expect(R.toggleClaim(crew, map, 0, 0).claims['0,0']).toBe(true);
  });
});

describe('table helpers', () => {
  it('status band text and colours', () => {
    expect(R.statusBand(0)).toBe('NEUTRAL');
    expect(R.statusBand(2)).toBe('+2 · FRIENDLY');
    expect(R.statusBand(-1)).toBe('−1 · INTERFERING');
    expect(R.statusInk(-3)).toBe('#5e1e10');
    expect(R.statusTint(3)).toBe('#dde5cb');
  });
  it('tier weight and clocks', () => {
    expect(R.tierWeight('II')).toEqual({ border: 2, shadow: 4.4, alpha: 0.34 });
    const c = { id: 'c', name: 'x', size: 6, filled: 5 };
    expect(R.tickClock(c, 3).filled).toBe(6);
    expect(R.tickClock(c, -9).filled).toBe(0);
    expect(R.cycleClockSize({ ...c, size: 12, filled: 12 })).toMatchObject({ size: 4, filled: 4 });
  });
  it('edge tone and truncation', () => {
    expect(R.edgeTone('Hostile')).toBe('red');
    expect(R.edgeTone('allied with')).toBe('green');
    expect(R.edgeTone('Uses')).toBe('ink');
    expect(R.truncate('a'.repeat(130)).length).toBeLessThanOrEqual(121);
    expect(R.truncate('short')).toBe('short');
  });
  it('one-line derivation for book factions', () => {
    const node: TableNode = { id: 'n', type: 'faction', name: 'The Red Sashes', ref: 'red-sashes', x: 0, y: 0, tier: 'II', district: '', status: 0, blurb: '', wants: '', details: '', moves: '', notes: '', f: {}, clocks: {} };
    expect(R.oneLine(node).length).toBeGreaterThan(10);
    expect(R.oneLine({ ...node, blurb: 'custom line' })).toBe('custom line');
  });
});
