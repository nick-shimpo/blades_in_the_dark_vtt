import { useEffect, useState } from 'preact/hooks';
import { RESULT_LABELS } from '../ledger/rules';
import { useLedger } from './context';

const SHOW_MS = 14000;

/** Recent shared dice results, bottom-right, visible to everyone at the table for a few seconds. */
export function RollTicker() {
  const { rolls } = useLedger();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const recent = rolls.filter((r) => now - r.at < SHOW_MS).slice(-4).reverse();
  if (!recent.length) return null;
  return (
    <div class="roll-ticker" aria-live="polite">
      {recent.map((r) => (
        <div class="roll-toast" key={r.id}>
          <div class="roll-who">
            {r.who || 'Someone'} · {r.kind === 'resistance' ? 'resists with ' : ''}
            {r.label}
            {r.position ? ` · ${r.position}` : ''}
          </div>
          <div class="roll-dice">
            {r.dice.map((d, i) => (
              <span key={i} class={`die${d === 6 ? ' six' : ''}`}>
                {d}
              </span>
            ))}
            <span class={`roll-result${r.result === 'failure' ? ' bad' : ''}`}>{RESULT_LABELS[r.result]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
