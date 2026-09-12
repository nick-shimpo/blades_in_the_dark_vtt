/**
 * Rules engine: every derivation and state transition from
 * design/handoff/docs/rules-engine.md, as pure functions over the ledger types.
 * Nothing here touches the DOM or the store; the UI calls these and writes the result.
 */
import {
  ACTIONS_BY_ATTRIBUTE,
  allItemsFor,
  bookEntry,
  claimsMaps,
  crewType,
  playbook,
  romanToInt,
  type AttributeId,
  type ClaimsMap,
  type CrewTypeId,
} from '../data';
import { newId } from './ids';
import type { CharacterSheet, Clock, Cohort, CrewSheet, HarmRows, NodeType, TableNode, Track } from './types';

// ================================================================ character sheet

export const SPECIAL_ARMOR_ABILITIES = ['battleborn', 'focused', 'fortitude', 'shadow', 'subterfuge', 'mastermind', 'warded'];

export function hasAbility(ch: CharacterSheet, id: string): boolean {
  return !!ch.abilities[id] || ch.veteran.some((v) => v.id === id);
}

/** Attribute rating = number of that attribute's actions with at least one dot. */
export function attrRating(ch: CharacterSheet, attr: AttributeId): number {
  return ACTIONS_BY_ATTRIBUTE[attr].filter((a) => (ch.actions[a] ?? 0) > 0).length;
}

export function actionCap(crew: CrewSheet): number {
  return (crew.upgrades.mastery ?? 0) >= 4 ? 4 : 3;
}

export function stressMax(ch: CharacterSheet, crew: CrewSheet): number {
  let m = 9;
  if (hasAbility(ch, 'survivor')) m += 1;
  if ((crew.upgrades.composed ?? 0) >= 3 || (crew.upgrades.steady ?? 0) >= 3) m += 1;
  return Math.min(12, m);
}

export function traumaMax(crew: CrewSheet): number {
  return (crew.upgrades.hardened ?? 0) >= 3 || (crew.upgrades.ordained ?? 0) >= 3 ? 5 : 4;
}

export interface StressResult {
  char: CharacterSheet;
  trauma: boolean;
}

/** Add (or remove, if negative) stress. Marking the last box clears stress and adds a trauma. */
export function addStress(ch: CharacterSheet, crew: CrewSheet, n: number): StressResult {
  const max = stressMax(ch, crew);
  const stress = Math.max(0, ch.stress + n);
  if (stress >= max) {
    return { char: { ...ch, stress: 0, trauma: Math.min(traumaMax(crew), ch.trauma + 1) }, trauma: true };
  }
  return { char: { ...ch, stress }, trauma: false };
}

export function setStress(ch: CharacterSheet, crew: CrewSheet, value: number): StressResult {
  return addStress(ch, crew, value - ch.stress);
}

export function toggleTraumaCondition(ch: CharacterSheet, cond: string): CharacterSheet {
  const has = ch.traumaConds.includes(cond);
  return { ...ch, traumaConds: has ? ch.traumaConds.filter((c) => c !== cond) : [...ch.traumaConds, cond] };
}

// ---------------------------------------------------------------- harm

export type HarmLevel = 1 | 2 | 3;

/** Where a new injury of this level would land: the first empty cell, moving up a row when full. */
export function harmSlot(ch: CharacterSheet, level: HarmLevel): { level: HarmLevel; index: number } | { level: 4; index: -1 } {
  let lvl: number = level;
  while (lvl <= 3) {
    const row = ch.harm[String(lvl) as keyof HarmRows] as string[];
    const idx = row.findIndex((c) => !c.trim());
    if (idx >= 0) return { level: lvl as HarmLevel, index: idx };
    lvl++;
  }
  return { level: 4, index: -1 };
}

/** Write an injury into a specific cell. Recording new harm clears the healing clock. */
export function recordHarm(ch: CharacterSheet, level: HarmLevel, index: number, text: string): CharacterSheet {
  const key = String(level) as keyof HarmRows;
  const row = [...(ch.harm[key] as string[])];
  row[index] = text;
  const harm = { ...ch.harm, [key]: row } as HarmRows;
  return { ...ch, harm, healing: hasAbility(ch, 'vigorous') ? 1 : 0 };
}

/** Convenience: take harm at a level with the cascade. Returns fatal when level 3 is already full. */
export function takeHarm(ch: CharacterSheet, level: HarmLevel, text: string): { char: CharacterSheet; level: number; fatal: boolean } {
  const slot = harmSlot(ch, level);
  if (slot.level === 4) return { char: ch, level: 4, fatal: true };
  return { char: recordHarm(ch, slot.level, slot.index, text), level: slot.level, fatal: false };
}

export function clearHarmCell(ch: CharacterSheet, level: HarmLevel, index: number): CharacterSheet {
  const key = String(level) as keyof HarmRows;
  const row = [...(ch.harm[key] as string[])];
  row[index] = '';
  return { ...ch, harm: { ...ch.harm, [key]: row } as HarmRows };
}

/** Every injury moves down one level; level 1 injuries heal. */
export function shiftHarmDown(h: HarmRows): HarmRows {
  const pad = (xs: string[], n: number): string[] => {
    const out = xs.filter((x) => x.trim());
    while (out.length < n) out.push('');
    return out.slice(0, n);
  };
  return {
    '3': [''],
    '2': pad(h['3'], 2) as [string, string],
    '1': pad(h['2'], 2) as [string, string],
  };
}

/** Tick the 4-segment healing clock; filling it heals every injury one level (excess ticks roll over). */
export function healTick(ch: CharacterSheet, n = 1): CharacterSheet {
  let healing = ch.healing + n;
  let harm = ch.harm;
  while (healing >= 4) {
    healing -= 4;
    harm = shiftHarmDown(harm);
  }
  healing = Math.max(hasAbility(ch, 'vigorous') ? 1 : 0, healing);
  return { ...ch, harm, healing };
}

const PENALTIES: Record<HarmLevel, string> = { 3: 'NEED HELP', 2: '−1D', 1: 'REDUCED EFFECT' };

/** Penalty label for a harm row; Tough as Nails shifts every penalty one level down. */
export function harmPenalty(ch: CharacterSheet, level: HarmLevel): string {
  if (!hasAbility(ch, 'tough_as_nails')) return PENALTIES[level];
  return level === 3 ? PENALTIES[2] : level === 2 ? PENALTIES[1] : '—';
}

export function isFatal(ch: CharacterSheet): boolean {
  return harmSlot(ch, 3).level === 4;
}

// ---------------------------------------------------------------- armor, load

export function hasSpecialArmor(ch: CharacterSheet): boolean {
  return SPECIAL_ARMOR_ABILITIES.some((id) => hasAbility(ch, id));
}

export function restoreArmor(ch: CharacterSheet): CharacterSheet {
  return { ...ch, armor: {} };
}

export interface LoadLimits {
  light: number;
  normal: number;
  heavy: number;
  max: number;
}

export function loadLimits(ch: CharacterSheet): LoadLimits {
  return hasAbility(ch, 'mule') ? { light: 5, normal: 7, heavy: 8, max: 10 } : { light: 3, normal: 5, heavy: 6, max: 8 };
}

export function loadLimit(ch: CharacterSheet): number {
  return loadLimits(ch)[ch.load];
}

/** Sum of the load of ticked items. Unknown item ids (from other tools) count nothing. */
export function loadUsed(ch: CharacterSheet): number {
  const items = allItemsFor(playbook(ch.playbook));
  let used = 0;
  for (const it of items) if (ch.items[it.id]) used += it.load;
  return used;
}

// ---------------------------------------------------------------- stash and coin

export const LIFESTYLE_WORDS = ['street life', 'poor', 'meager', 'modest', 'fine'] as const;

export function lifestyle(stash: number): number {
  return Math.max(0, Math.min(4, Math.floor(stash / 10)));
}

export function stashToCoin(ch: CharacterSheet): CharacterSheet | null {
  if (ch.stash < 2 || ch.coin >= 4) return null;
  return { ...ch, stash: ch.stash - 2, coin: ch.coin + 1 };
}

export function coinToStash(ch: CharacterSheet): CharacterSheet | null {
  if (ch.coin < 1 || ch.stash >= 40) return null;
  return { ...ch, stash: ch.stash + 1, coin: ch.coin - 1 };
}

// ---------------------------------------------------------------- xp and advances

export function trackLength(track: Track): number {
  return track === 'playbook' ? 8 : 6;
}

export interface XpResult {
  char: CharacterSheet;
  advances: number; // advances gained by this change
}

/** Add xp to a track; each time it fills it clears and grants an advance (remainder carries over). */
export function addXp(ch: CharacterSheet, track: Track, n = 1): XpResult {
  const len = trackLength(track);
  let xp = Math.max(0, (ch.xp[track] ?? 0) + n);
  let gained = 0;
  while (xp >= len) {
    xp -= len;
    gained++;
  }
  const char: CharacterSheet = {
    ...ch,
    xp: { ...ch.xp, [track]: xp },
    advances: gained ? { ...ch.advances, [track]: (ch.advances[track] ?? 0) + gained } : ch.advances,
  };
  return { char, advances: gained };
}

/** Clicking box i of a track sets it to i+1 (or lowers it by one when i is the current mark). */
export function setXp(ch: CharacterSheet, track: Track, value: number): XpResult {
  return addXp(ch, track, value - (ch.xp[track] ?? 0));
}

export function spendAdvance(ch: CharacterSheet, track: Track): CharacterSheet {
  const cur = ch.advances[track] ?? 0;
  if (cur <= 0) return ch;
  return { ...ch, advances: { ...ch.advances, [track]: cur - 1 } };
}

/** Set an action rating, clamped to the cap. Clicking the current rating lowers it by one. */
export function setAction(ch: CharacterSheet, crew: CrewSheet, action: keyof CharacterSheet['actions'], value: number): CharacterSheet {
  const cap = actionCap(crew);
  const cur = ch.actions[action] ?? 0;
  const next = value === cur ? Math.max(0, cur - 1) : Math.max(0, Math.min(cap, value));
  return { ...ch, actions: { ...ch.actions, [action]: next } };
}

// ================================================================ rolls

export type Position = 'controlled' | 'risky' | 'desperate';
export type Effect = 'limited' | 'standard' | 'great';
export type RollResult = 'critical' | 'success' | 'partial' | 'failure';

export const OUTCOMES: Record<Position, Record<'crit' | 'six' | 'mid' | 'low', string>> = {
  controlled: {
    crit: 'You do it with increased effect.',
    six: 'You do it.',
    mid: 'You hesitate. Withdraw and try a different approach, or else do it with a minor consequence: a minor complication occurs, you have reduced effect, you suffer lesser harm, you end up in a risky position.',
    low: 'You falter. Press on by seizing a risky opportunity, or withdraw and try a different approach.',
  },
  risky: {
    crit: 'You do it with increased effect.',
    six: 'You do it.',
    mid: "You do it, but there's a consequence: you suffer harm, a complication occurs, you have reduced effect, you end up in a desperate position.",
    low: 'Things go badly. You suffer harm, a complication occurs, you end up in a desperate position, you lose this opportunity.',
  },
  desperate: {
    crit: 'You do it with increased effect.',
    six: 'You do it.',
    mid: "You do it, but there's a consequence: you suffer severe harm, a serious complication occurs, you have reduced effect.",
    low: "It's the worst outcome. You suffer severe harm, a serious complication occurs, you lose this opportunity for action.",
  },
};

export interface RollOptions {
  bonus?: 'push' | 'bargain' | null; // +1d, mutually exclusive
  assist?: boolean; // +1d from a teammate
}

export function rollPool(dots: number, opts: RollOptions = {}): number {
  return Math.max(0, dots) + (opts.bonus ? 1 : 0) + (opts.assist ? 1 : 0);
}

export interface DiceRoll {
  dice: number[];
  highest: number;
  result: RollResult;
  zeroPool: boolean;
}

export function judge(dice: number[], zeroPool: boolean): DiceRoll {
  if (zeroPool) {
    const highest = Math.min(...dice);
    return { dice, highest, result: highest === 6 ? 'success' : highest >= 4 ? 'partial' : 'failure', zeroPool };
  }
  const highest = Math.max(...dice);
  const sixes = dice.filter((d) => d === 6).length;
  const result: RollResult = sixes >= 2 ? 'critical' : highest === 6 ? 'success' : highest >= 4 ? 'partial' : 'failure';
  return { dice, highest, result, zeroPool };
}

/** Roll a pool. Zero dice rolls 2d and keeps the lowest with no critical possible. */
export function rollDice(pool: number, rng: () => number = Math.random): DiceRoll {
  const d6 = () => 1 + Math.floor(rng() * 6);
  if (pool <= 0) return judge([d6(), d6()], true);
  return judge(Array.from({ length: pool }, d6), false);
}

export function outcomeText(position: Position, result: RollResult): string {
  const key = result === 'critical' ? 'crit' : result === 'success' ? 'six' : result === 'partial' ? 'mid' : 'low';
  return OUTCOMES[position][key];
}

export const RESULT_LABELS: Record<RollResult, string> = {
  critical: 'CRITICAL',
  success: 'FULL SUCCESS',
  partial: 'PARTIAL — CONSEQUENCE',
  failure: 'BAD OUTCOME',
};

/** Resistance: stress taken is 6 minus the highest die; a critical clears 1 stress instead. */
export function resistanceStress(roll: DiceRoll): number {
  return roll.result === 'critical' ? -1 : 6 - roll.highest;
}

// ================================================================ crew sheet

export function crewHasAbility(crew: CrewSheet, id: string): boolean {
  return !!crew.abilities[id];
}

export function claimsMapFor(type: CrewTypeId | null): ClaimsMap | undefined {
  if (!type) return undefined;
  return crewType(type)?.map ?? claimsMaps[type];
}

export const claimKey = (r: number, c: number) => `${r},${c}`;

export function isHubTile(map: ClaimsMap, r: number, c: number): boolean {
  return map.hub[0] === r && map.hub[1] === c;
}

export function isClaimHeld(crew: CrewSheet, map: ClaimsMap, r: number, c: number): boolean {
  return isHubTile(map, r, c) || !!crew.claims[claimKey(r, c)];
}

export function heldClaimLabels(crew: CrewSheet): string[] {
  const map = claimsMapFor(crew.type);
  if (!map) return [];
  const out: string[] = [];
  for (let r = 0; r < map.rows; r++)
    for (let c = 0; c < map.cols; c++) if (!isHubTile(map, r, c) && crew.claims[claimKey(r, c)]) out.push(map.tiles[r][c]);
  return out;
}

/** Turf = held turf tiles, plus wanted levels with Fiends, plus up to three +3 factions with Accord; max 6. */
export function turfCount(crew: CrewSheet, nodes: Record<string, TableNode> = {}): number {
  let turf = heldClaimLabels(crew).filter((l) => l === 'turf').length;
  if (crewHasAbility(crew, 'fiends')) turf += crew.wanted;
  if (crewHasAbility(crew, 'accord')) {
    const allies = Object.values(nodes).filter((n) => n.type === 'faction' && n.status >= 3).length;
    turf += Math.min(3, allies);
  }
  return Math.min(6, turf);
}

export function repNeeded(crew: CrewSheet, nodes: Record<string, TableNode> = {}): number {
  return Math.max(6, 12 - turfCount(crew, nodes));
}

export function canDevelop(crew: CrewSheet, nodes: Record<string, TableNode> = {}): boolean {
  return crew.rep >= repNeeded(crew, nodes);
}

/** Coin cost of the next Tier (halved by Patron). Shown, not deducted: it comes from stashes too. */
export function developCost(crew: CrewSheet): number {
  const cost = (crew.tier + 1) * 8;
  return crewHasAbility(crew, 'patron') ? Math.ceil(cost / 2) : cost;
}

export function develop(crew: CrewSheet): CrewSheet {
  if (crew.hold === 'weak') return { ...crew, hold: 'strong', rep: 0 };
  return { ...crew, tier: Math.min(6, crew.tier + 1), hold: 'weak', rep: 0 };
}

export function setRep(crew: CrewSheet, value: number, nodes: Record<string, TableNode> = {}): CrewSheet {
  return { ...crew, rep: Math.max(0, Math.min(repNeeded(crew, nodes), value)) };
}

/** Heat rolls into wanted level at 9 (excess carries over); wanted maxes at 4. */
export function addHeat(crew: CrewSheet, n: number): CrewSheet {
  let heat = Math.max(0, crew.heat + n);
  let wanted = crew.wanted;
  while (heat >= 9) {
    heat -= 9;
    wanted = Math.min(4, wanted + 1);
  }
  return { ...crew, heat, wanted };
}

export function setHeat(crew: CrewSheet, value: number): CrewSheet {
  return addHeat(crew, value - crew.heat);
}

export function coinCap(crew: CrewSheet): number {
  return [4, 8, 16][Math.min(2, crew.upgrades.vault ?? 0)];
}

export interface CrewXpResult {
  crew: CrewSheet;
  advances: number;
}

export function addCrewXp(crew: CrewSheet, n = 1): CrewXpResult {
  let xp = Math.max(0, crew.xp + n);
  let gained = 0;
  while (xp >= 8) {
    xp -= 8;
    gained++;
  }
  return { crew: { ...crew, xp, advances: crew.advances + gained }, advances: gained };
}

export function setCrewXp(crew: CrewSheet, value: number): CrewXpResult {
  return addCrewXp(crew, value - crew.xp);
}

export function spendCrewAdvance(crew: CrewSheet): CrewSheet {
  return crew.advances > 0 ? { ...crew, advances: crew.advances - 1 } : crew;
}

/** Click box i of an upgrade: fill up to i+1, or lower by one when i is the current mark. */
export function setUpgrade(crew: CrewSheet, id: string, boxes: number, value: number): CrewSheet {
  const cur = crew.upgrades[id] ?? 0;
  const next = value === cur ? Math.max(0, cur - 1) : Math.max(0, Math.min(boxes, value));
  const upgrades = { ...crew.upgrades };
  if (next > 0) upgrades[id] = next;
  else delete upgrades[id];
  return { ...crew, upgrades };
}

// ---------------------------------------------------------------- cohorts

export interface CohortStats {
  quality: number;
  scale: number;
  elite: boolean;
}

const SCALE_CLAIMS: Record<string, string> = { barracks: 'Thugs', cloister: 'Adepts', 'training rooms': 'Skulks' };

export function cohortStats(cohort: Cohort, crew: CrewSheet): CohortStats {
  const quality = cohort.kind === 'expert' ? crew.tier + 1 : crew.tier;
  let scale = cohort.kind === 'expert' ? 0 : crew.tier;
  if (cohort.kind === 'gang') {
    for (const label of heldClaimLabels(crew)) {
      const t = SCALE_CLAIMS[label];
      if (t && cohort.types.includes(t)) scale += 1;
    }
  }
  const elite = cohort.types.some((t) => (crew.upgrades[`elite_${t.toLowerCase()}`] ?? 0) > 0);
  return { quality, scale, elite };
}

export function newCohort(kind: Cohort['kind'], types: string[] = []): Cohort {
  return { id: newId('co'), kind, name: '', types: types.slice(0, 2), expertType: '', edges: [], flaws: [], harm: 0, armor: false };
}

export const COHORT_HARM = ['—', 'Weakened', 'Impaired', 'Broken', 'Dead'] as const;

// ---------------------------------------------------------------- claims map

function neighboursOf(map: ClaimsMap): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const [a, b] of map.connections) {
    const ka = claimKey(a[0], a[1]);
    const kb = claimKey(b[0], b[1]);
    adj.set(ka, [...(adj.get(ka) ?? []), kb]);
    adj.set(kb, [...(adj.get(kb) ?? []), ka]);
  }
  return adj;
}

/** Held tiles that cannot reach the lair through held tiles along connectors. */
export function offPathClaims(crew: CrewSheet, map: ClaimsMap): Set<string> {
  const adj = neighboursOf(map);
  const held = (k: string) => {
    const [r, c] = k.split(',').map(Number);
    return isClaimHeld(crew, map, r, c);
  };
  const start = claimKey(map.hub[0], map.hub[1]);
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const k = queue.shift()!;
    for (const n of adj.get(k) ?? []) {
      if (!seen.has(n) && held(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  const off = new Set<string>();
  for (const k of Object.keys(crew.claims)) if (crew.claims[k] && !seen.has(k)) off.add(k);
  return off;
}

export function isConnected(map: ClaimsMap, a: [number, number], b: [number, number]): boolean {
  return map.connections.some(
    ([p, q]) => (p[0] === a[0] && p[1] === a[1] && q[0] === b[0] && q[1] === b[1]) || (p[0] === b[0] && p[1] === b[1] && q[0] === a[0] && q[1] === a[1]),
  );
}

export function toggleClaim(crew: CrewSheet, map: ClaimsMap, r: number, c: number): CrewSheet {
  if (isHubTile(map, r, c)) return crew;
  const key = claimKey(r, c);
  const claims = { ...crew.claims };
  if (claims[key]) delete claims[key];
  else claims[key] = true;
  return { ...crew, claims };
}

// ---------------------------------------------------------------- crew type

/** Choosing a crew type resets the type-bound parts of the sheet and pre-fills its starting upgrades. */
export function pickCrewType(crew: CrewSheet, typeId: CrewTypeId): CrewSheet {
  const ct = crewType(typeId);
  const upgrades: Record<string, number> = {};
  const cohorts: Record<string, Cohort> = {};
  for (const s of ct?.startingUpgrades ?? []) {
    let m: RegExpExecArray | null;
    if ((m = /^Training:\s*(\w+)/i.exec(s))) upgrades[`training_${m[1].toLowerCase()}`] = 1;
    else if ((m = /^Cohort:\s*Gang,\s*type\s+(\w+)/i.exec(s))) {
      const co = newCohort('gang', [m[1]]);
      cohorts[co.id] = co;
    } else if (/^Lair:\s*Secure/i.test(s)) upgrades.secure_lair = 1;
    else if (/^Lair:\s*Hidden/i.test(s)) upgrades.hidden_lair = 1;
    else if (/^Vehicle/i.test(s)) upgrades.boat_house = 1;
  }
  return { ...crew, type: typeId, abilities: {}, upgrades, cohorts, claims: {}, contacts: {}, operation: '', deity: '' };
}

export function resetCrewType(crew: CrewSheet): CrewSheet {
  return { ...crew, type: null, abilities: {}, upgrades: {}, cohorts: {}, claims: {}, contacts: {}, operation: '', deity: '' };
}

// ================================================================ table

export const STATUS_TINTS = ['#eed6ca', '#eedbd0', '#efe3d2', '#f2ead2', '#ebead2', '#e3e8d0', '#dde5cb'];
export const STATUS_INKS = ['#5e1e10', '#8c2f1b', '#9c4a2c', '#8a7d64', '#586b3a', '#3f6a45', '#2d5a3a'];
export const STATUS_WORDS = ['WAR', 'HOSTILE', 'INTERFERING', 'NEUTRAL', 'HELPFUL', 'FRIENDLY', 'ALLIES'];

const clampStatus = (s: number) => Math.max(-3, Math.min(3, Math.round(s)));
export const statusTint = (s: number) => STATUS_TINTS[clampStatus(s) + 3];
export const statusInk = (s: number) => STATUS_INKS[clampStatus(s) + 3];
export const statusWord = (s: number) => STATUS_WORDS[clampStatus(s) + 3];

export function statusBand(s: number): string {
  const v = clampStatus(s);
  if (v === 0) return 'NEUTRAL';
  return `${v > 0 ? '+' : '−'}${Math.abs(v)} · ${statusWord(v)}`;
}

export function tierWeight(tier: string): { border: number; shadow: number; alpha: number } {
  const t = romanToInt(tier || '0');
  return { border: 1 + 0.5 * t, shadow: 3 + 0.7 * t, alpha: 0.26 + 0.04 * t };
}

export function nodeWidth(type: NodeType): number {
  if (type === 'crew' || type === 'faction' || type === 'district') return 280;
  if (type === 'npc' || type === 'location' || type === 'org') return 260;
  return 250;
}

export function tickClock(clock: Clock, n: number): Clock {
  return { ...clock, filled: Math.max(0, Math.min(clock.size, clock.filled + n)) };
}

export function cycleClockSize(clock: Clock): Clock {
  const sizes = [4, 6, 8, 10, 12];
  const size = sizes[(sizes.indexOf(clock.size) + 1) % sizes.length];
  return { ...clock, size, filled: Math.min(clock.filled, size) };
}

export function newClock(name = 'New clock', size = 6): Clock {
  return { id: newId('c'), name, size, filled: 0 };
}

export type EdgeTone = 'red' | 'green' | 'ink';
export function edgeTone(label: string): EdgeTone {
  const l = label.trim().toLowerCase();
  if (/^(rival|hostile|at war|war|fears|enem|hunts|hates|contests|threat)/.test(l)) return 'red';
  if (/^(allied|friendly|protects|ally|loves|trusts|shelters)/.test(l)) return 'green';
  return 'ink';
}

export function truncate(s: string, n = 120): string {
  const t = s.trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const i = cut.lastIndexOf(' ');
  return (i > 40 ? cut.slice(0, i) : cut).replace(/[,;:.]+$/, '') + '…';
}

export function firstSentence(s: string | null | undefined): string {
  if (!s) return '';
  const m = /^(.+?[.!?])(\s|$)/.exec(s.trim());
  return (m ? m[1] : s.trim()).trim();
}

/** The one line shown on a Table card when the node has no blurb of its own. */
export function oneLine(node: TableNode, crewTypeName?: string): string {
  if (node.blurb.trim()) return truncate(node.blurb);
  let line = '';
  switch (node.type) {
    case 'faction': {
      const e = node.ref ? bookEntry('faction', node.ref) : undefined;
      line = firstSentence(node.f.tagline || (e?.kind === 'faction' ? e.entry.detail?.tagline || e.entry.summary : ''));
      break;
    }
    case 'npc': {
      const e = node.ref ? bookEntry('npc', node.ref) : undefined;
      if (e?.kind === 'npc') {
        const role = e.entry.roles[0] ?? '';
        const faction = e.entry.faction_ids[0] ? bookEntry('faction', e.entry.faction_ids[0]) : undefined;
        const fname = faction?.kind === 'faction' ? faction.entry.name : '';
        line = [role, fname].filter(Boolean).join(' · ') || firstSentence(e.entry.description);
      } else line = node.f.roles || node.f.role || '';
      break;
    }
    case 'location': {
      const e = node.ref ? bookEntry('location', node.ref) : undefined;
      if (e?.kind === 'location') line = firstSentence(e.entry.description) || [e.entry.type, node.district].filter(Boolean).join(' in ');
      else line = node.district ? `in ${node.district}` : '';
      break;
    }
    case 'district': {
      const e = node.ref ? bookEntry('district', node.ref) : undefined;
      line = e?.kind === 'district' ? firstSentence(e.entry.summary) : '';
      break;
    }
    case 'crew':
      line = [crewTypeName ?? node.f.crewType, node.district].filter(Boolean).join(' · ');
      break;
    default:
      line = node.district || '';
  }
  return truncate(line);
}
