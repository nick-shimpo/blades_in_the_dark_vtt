/**
 * Action roll / resistance roll dialog (design/handoff/README.md "Roll dialog", rules-engine §3).
 * Dice are ephemeral: the result lives in this dialog's state and in the shared ticker, never in the ledger.
 * Stress, xp and assists are applied through the rules so trauma and advances trigger as they should.
 */
import { useEffect } from 'preact/hooks';
import type { ActionId, AttributeId } from '../../data';
import { newId } from '../../ledger/ids';
import { charactersInOrder } from '../../ledger/normalize';
import {
  addStress,
  addXp,
  attrRating,
  outcomeText,
  resistanceStress,
  RESULT_LABELS,
  rollDice,
  rollPool,
  type DiceRoll,
  type Effect,
  type Position,
} from '../../ledger/rules';
import type { RollRecord } from '../../ledger/types';
import { useLedger } from '../../ui/context';
import { Dialog } from '../../ui/Dialog';
import { capitalize, Seg, useSheetWriters } from './bits';

export interface RollRequest {
  kind: 'action' | 'resist';
  charId: string;
  action?: ActionId;
  attr: AttributeId;
}

export interface RollState extends RollRequest {
  pos: Position;
  eff: Effect;
  bonus: 'push' | 'bargain' | null;
  assist: string; // teammate id
  pushEff: boolean;
  roll: DiceRoll | null;
  applied: string;
}

export function newRollState(r: RollRequest): RollState {
  return { ...r, pos: 'risky', eff: 'standard', bonus: null, assist: '', pushEff: false, roll: null, applied: '' };
}

const POSITIONS = [
  ['controlled', 'CONTROLLED'],
  ['risky', 'RISKY'],
  ['desperate', 'DESPERATE'],
] as const;
const EFFECTS = [
  ['limited', 'LIMITED'],
  ['standard', 'STANDARD'],
  ['great', 'GREAT'],
] as const;
const BONUSES = [
  ['push', 'PUSH · 2 STRESS'],
  ['bargain', "DEVIL'S BARGAIN"],
] as const;

export function RollDialog({
  roll: R,
  setRoll,
  onClose,
  onTrauma,
}: {
  roll: RollState;
  setRoll: (fn: (prev: RollState | null) => RollState | null) => void;
  onClose: () => void;
  /** A stress change tipped this character into trauma: show the "choose a condition" hint on their sheet. */
  onTrauma: (charId: string) => void;
}) {
  const { ledger, saveChar, pushRoll } = useLedger();
  const { latest } = useSheetWriters();
  const ch = ledger.sheets.chars[R.charId];

  useEffect(() => {
    if (!ch) onClose();
  }, [ch, onClose]);
  if (!ch) return null;

  const isA = R.kind === 'action';
  const action = isA ? R.action : undefined;
  const others = charactersInOrder(ledger).filter((c) => c.id !== ch.id);
  const assistOk = !!R.assist && others.some((c) => c.id === R.assist);
  const dots = action ? (ch.actions[action] ?? 0) : attrRating(ch, R.attr);
  const pool = isA ? rollPool(dots, { bonus: R.bonus, assist: assistOk }) : rollPool(dots);
  const zero = pool === 0;

  /** Any option change discards the last result. */
  const set = (p: Partial<RollState>) => setRoll((prev) => (prev ? { ...prev, ...p, roll: null, applied: '' } : prev));

  const doRoll = () => {
    const l = latest();
    const live = l.sheets.chars[R.charId];
    if (!live) return;
    const crew = l.sheets.crew;
    const liveDots = action ? (live.actions[action] ?? 0) : attrRating(live, R.attr);
    const assistant = isA && R.assist ? l.sheets.chars[R.assist] : undefined;
    const livePool = isA ? rollPool(liveDots, { bonus: R.bonus, assist: !!assistant }) : rollPool(liveDots);
    const result = rollDice(livePool);

    const applied: string[] = [];
    let next = live;
    let stress = 0;
    if (isA) {
      if (R.bonus === 'push') stress += 2;
      if (R.pushEff) stress += 2;
      if (stress) applied.push(`${stress} stress`);
      if (assistant) {
        const r = addStress(assistant, crew, 1);
        saveChar(assistant, r.char);
        applied.push(`${assistant.name || 'the assistant'} takes 1 stress${r.trauma ? ' — trauma' : ''}`);
        if (r.trauma) onTrauma(assistant.id);
      }
      if (R.pos === 'desperate') {
        const r = addXp(next, R.attr, 1);
        next = r.char;
        applied.push(`1 xp in ${R.attr}${r.advances ? ' — track filled, advance earned' : ''}`);
      }
    } else {
      stress = resistanceStress(result);
      applied.push(stress < 0 ? 'cleared 1 stress' : stress === 0 ? 'no stress' : `${stress} stress`);
    }
    let trauma = false;
    if (stress !== 0) {
      const r = addStress(next, crew, stress);
      next = r.char;
      trauma = r.trauma;
    }
    if (trauma) {
      applied.push('trauma — choose a condition');
      onTrauma(live.id);
    }
    if (next !== live) saveChar(live, next);

    const record: RollRecord = {
      id: newId('r'),
      at: Date.now(),
      who: live.name || 'Unnamed',
      kind: isA ? 'action' : 'resistance',
      label: capitalize(action ?? R.attr),
      dice: result.dice,
      pool: livePool,
      result: result.result,
    };
    if (isA) {
      record.position = R.pos;
      record.effect = R.eff;
    }
    if (applied.length) record.applied = applied.join(' · ');
    pushRoll(record);
    setRoll((prev) => (prev ? { ...prev, roll: result, applied: applied.length ? `Applied: ${applied.join(' · ')}` : '' } : prev));
  };

  const poolNote = zero
    ? 'Zero dice: roll 2d and take the lowest.'
    : isA
      ? `${dots}d from ${action}${R.bonus ? ` · +1d ${R.bonus === 'push' ? 'pushing yourself' : "devil's bargain"}` : ''}${assistOk ? ' · +1d assist' : ''}`
      : `${dots}d from your ${R.attr} rating`;

  let resultText = '';
  if (R.roll) {
    if (isA) resultText = outcomeText(R.pos, R.roll.result) + (R.roll.result !== 'critical' && R.eff !== 'standard' ? ` Effect: ${R.eff}.` : '');
    else
      resultText =
        R.roll.result === 'critical'
          ? 'Critical — clear 1 stress. The consequence is reduced or avoided.'
          : `Highest die ${R.roll.highest} — take ${6 - R.roll.highest} stress. The consequence is reduced or avoided.`;
  }

  return (
    <Dialog
      class="sh-roll"
      place="center"
      onClose={onClose}
      title={
        <>
          <span class="sh-roll-title">{isA ? (action ?? '').toUpperCase() : `RESIST · ${R.attr.toUpperCase()}`}</span>
          <span class="sh-roll-who">{ch.name || 'Unnamed'}</span>
          <span class="sh-spacer" />
          <button type="button" class="sh-roll-x" title="Close (esc)" onClick={onClose}>
            ✕
          </button>
        </>
      }
    >
      {isA ? (
        <div class="sh-roll-grid">
          <span class="sh-label">POSITION</span>
          <Seg options={POSITIONS} value={R.pos} onChange={(k) => set({ pos: k })} />
          <span class="sh-label">EFFECT</span>
          <Seg options={EFFECTS} value={R.eff} onChange={(k) => set({ eff: k })} />
          <span class="sh-label">+1D FROM</span>
          <div class="sh-roll-bonus">
            <Seg options={BONUSES} value={R.bonus} onChange={(k) => set({ bonus: R.bonus === k ? null : k })} />
            <select
              class="sh-select"
              value={assistOk ? R.assist : ''}
              title="Assist: a teammate takes 1 stress to give you +1d"
              onChange={(e) => set({ assist: (e.currentTarget as HTMLSelectElement).value })}
            >
              <option value="">no assist</option>
              {others.map((c) => (
                <option key={c.id} value={c.id}>
                  assist from {c.name || 'Unnamed'}
                </option>
              ))}
            </select>
          </div>
          <span class="sh-label">ALSO</span>
          <div class="sh-seg">
            <button type="button" class={R.pushEff ? 'is-on' : ''} aria-pressed={R.pushEff} onClick={() => set({ pushEff: !R.pushEff })}>
              PUSH FOR +1 EFFECT · 2 STRESS
            </button>
          </div>
        </div>
      ) : (
        <div class="sh-roll-resist">
          Roll your {R.attr} rating. You take <b>6 stress minus the highest die</b>; a critical clears 1 stress instead. The consequence is reduced or
          avoided.
        </div>
      )}
      <div class="sh-roll-pool">
        <span class="sh-roll-pool-n">{zero ? '2D↓' : `${pool}D`}</span>
        <span class="sh-roll-pool-note">{poolNote}</span>
        <button type="button" class="sh-roll-go" onClick={doRoll}>
          {R.roll ? 'AGAIN' : 'ROLL'}
        </button>
      </div>
      {R.roll && (
        <>
          <div class="sh-dice">
            {R.roll.dice.map((d, i) => (
              <span key={i} class={`sh-die${d === 6 ? ' is-six' : ''}`}>
                {d}
              </span>
            ))}
          </div>
          <div class={`sh-roll-label${R.roll.result === 'failure' ? ' is-bad' : ''}`}>{RESULT_LABELS[R.roll.result]}</div>
          <div class="sh-roll-text">{resultText}</div>
          {R.applied && <div class="sh-roll-applied">{R.applied}</div>}
        </>
      )}
    </Dialog>
  );
}
