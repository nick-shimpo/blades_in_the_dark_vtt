import type { JSX } from 'preact';

export interface TrackBoxesProps {
  count: number;
  filled: number;
  /** Called with the new value: clicking box i gives i+1, clicking the current mark gives i. */
  onSet?: (value: number) => void;
  size?: number; // px
  /** Boxes from this index onward are hatched and not clickable (turf on the rep tracker). */
  hatchedFrom?: number;
  red?: boolean; // wanted level boxes
  gap?: number;
  title?: string;
  class?: string;
}

/** A row of square boxes: stress, xp, heat, rep, coin, wanted, upgrades. */
export function TrackBoxes({ count, filled, onSet, size = 24, hatchedFrom, red, gap = 4, title, class: cls }: TrackBoxesProps) {
  const boxes: JSX.Element[] = [];
  for (let i = 0; i < count; i++) {
    const hatched = hatchedFrom != null && i >= hatchedFrom;
    const on = i < filled;
    boxes.push(
      <button
        type="button"
        key={i}
        disabled={hatched || !onSet}
        aria-label={`${i + 1} of ${count}`}
        onClick={() => onSet && onSet(i + 1 === filled ? i : i + 1)}
        style={{
          width: size,
          height: size,
          padding: 0,
          border: `1.5px solid ${red ? 'var(--red)' : 'var(--ink)'}`,
          background: hatched
            ? 'repeating-linear-gradient(135deg, var(--ink) 0 2px, transparent 2px 6px)'
            : on
              ? red
                ? 'var(--red)'
                : 'var(--ink)'
              : 'var(--paper-light)',
          cursor: hatched || !onSet ? 'default' : 'pointer',
          opacity: hatched ? 0.85 : 1,
          flex: 'none',
        }}
      />,
    );
  }
  return (
    <div class={`track${cls ? ` ${cls}` : ''}`} title={title} style={{ display: 'inline-flex', gap, alignItems: 'center' }}>
      {boxes}
    </div>
  );
}

export interface RatingDotsProps {
  value: number;
  max?: number;
  onSet?: (value: number) => void;
  size?: number;
  /** Extra gap after the first dot (the attribute column), as on the printed sheet. */
  firstGap?: number;
  title?: string;
}

/** Four circles per action; filled ink, empty light grey. */
export function RatingDots({ value, max = 4, onSet, size = 18, firstGap = 9, title }: RatingDotsProps) {
  const dots: JSX.Element[] = [];
  for (let i = 0; i < max; i++) {
    const on = i < value;
    dots.push(
      <button
        type="button"
        key={i}
        disabled={!onSet}
        aria-label={`${i + 1} of ${max}`}
        onClick={() => onSet && onSet(i + 1 === value ? i : i + 1)}
        style={{
          width: size,
          height: size,
          padding: 0,
          borderRadius: '50%',
          border: '1.5px solid var(--ink)',
          background: on ? 'var(--ink)' : '#c7c8ca',
          marginLeft: i === 1 ? firstGap : 0,
          cursor: onSet ? 'pointer' : 'default',
          flex: 'none',
        }}
      />,
    );
  }
  return (
    <div class="dots" title={title} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {dots}
    </div>
  );
}

/** ▲ friend / ▼ rival pair, mutually exclusive. */
export function Triangles({ value, onChange }: { value: '' | 'friend' | 'rival'; onChange: (v: '' | 'friend' | 'rival') => void }) {
  const btn = (kind: 'friend' | 'rival', glyph: string) => (
    <button
      type="button"
      aria-label={kind}
      onClick={() => onChange(value === kind ? '' : kind)}
      style={{
        border: 0,
        background: 'transparent',
        padding: '0 2px',
        fontSize: 14,
        lineHeight: 1,
        color: value === kind ? 'var(--red)' : 'rgba(34,28,19,0.28)',
      }}
    >
      {glyph}
    </button>
  );
  return (
    <span class="triangles" style={{ display: 'inline-flex', gap: 2 }}>
      {btn('friend', '▲')}
      {btn('rival', '▼')}
    </span>
  );
}
