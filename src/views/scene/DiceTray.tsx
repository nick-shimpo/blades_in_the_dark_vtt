import { useState } from 'preact/hooks';
import { newId } from '../../ledger/ids';
import { outcomeText, RESULT_LABELS, rollDice } from '../../ledger/rules';
import type { RollRecord } from '../../ledger/types';
import { useLedger } from '../../ui/context';

/**
 * The dice tray: a column reserved on the Play view that always shows the last roll made anywhere
 * (character sheets, resistance, fortune) and the few before it. Rolls arrive through the shared
 * `rolls` list, so every browser sees them the moment they happen. A small fortune roller lets the
 * table roll plain dice from here.
 */
export function DiceTray() {
  const { rolls, pushRoll, role, ledger } = useLedger();
  const [pool, setPool] = useState(1);
  const latest = rolls.length ? rolls[rolls.length - 1] : null;
  const earlier = rolls.slice(0, -1).reverse().slice(0, 6);

  const fortune = () => {
    const r = rollDice(pool);
    pushRoll({
      id: newId('r'),
      at: Date.now(),
      who: role === 'gm' ? 'GM' : ledger.crew.name || 'The table',
      kind: 'fortune',
      label: `Fortune ${pool}d`,
      dice: r.dice,
      pool,
      result: r.result,
    });
  };

  return (
    <aside class="dice-tray" aria-label="dice tray">
      <div class="tray-bar">DICE</div>

      {latest ? <LatestRoll roll={latest} /> : <div class="tray-empty">No rolls yet. Rolls made on the sheets appear here for everyone.</div>}

      {earlier.length > 0 && (
        <div class="tray-history">
          <div class="tray-sub">EARLIER</div>
          {earlier.map((r) => (
            <div class="tray-row" key={r.id}>
              <span class="tray-row-who">
                {r.who} · {r.label}
              </span>
              <span class="tray-row-dice">
                {r.dice.map((d, i) => (
                  <span key={i} class={`tray-die small${d === 6 ? ' six' : ''}`}>
                    {d}
                  </span>
                ))}
              </span>
              <span class={`tray-row-result${r.result === 'failure' ? ' bad' : ''}`}>{shortResult(r.result)}</span>
            </div>
          ))}
        </div>
      )}

      <div class="tray-fortune">
        <div class="tray-sub">FORTUNE ROLL</div>
        <div class="tray-pool">
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <button type="button" key={n} class={`tray-pool-btn${n === pool ? ' on' : ''}`} onClick={() => setPool(n)} title={`${n} dice`}>
              {n}
            </button>
          ))}
          <button type="button" class="red tray-roll" onClick={fortune}>
            ROLL
          </button>
        </div>
      </div>
    </aside>
  );
}

function LatestRoll({ roll }: { roll: RollRecord }) {
  const time = new Date(roll.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const meta = [roll.kind === 'resistance' ? `resists with ${roll.label}` : roll.label, roll.position, roll.effect && roll.effect !== 'standard' ? `${roll.effect} effect` : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <div class="tray-latest">
      <div class="tray-who">
        <span class="tray-name">{roll.who || 'Someone'}</span>
        <span class="tray-time">{time}</span>
      </div>
      <div class="tray-meta">{meta}</div>
      <div class="tray-dice">
        {roll.dice.map((d, i) => (
          <span key={i} class={`tray-die${d === 6 ? ' six' : ''}`}>
            {d}
          </span>
        ))}
        {roll.pool === 0 && <span class="tray-zero">2d, lowest</span>}
      </div>
      <div class={`tray-result${roll.result === 'failure' ? ' bad' : ''}`}>{RESULT_LABELS[roll.result]}</div>
      {roll.kind === 'action' && roll.position && <div class="tray-outcome">{outcomeText(roll.position, roll.result)}</div>}
      {roll.applied && <div class="tray-applied">Applied: {roll.applied}</div>}
    </div>
  );
}

function shortResult(r: RollRecord['result']): string {
  return r === 'critical' ? 'CRIT' : r === 'success' ? '6' : r === 'partial' ? '4/5' : '1–3';
}
