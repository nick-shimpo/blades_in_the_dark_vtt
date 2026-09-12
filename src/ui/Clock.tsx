import type { JSX } from 'preact';

export interface ClockProps {
  size: number; // segments
  filled: number;
  diameter?: number; // px, 58 on Table cards, 36 in the dossier, 58 for healing
  onTick?: (delta: 1 | -1) => void;
  title?: string;
  class?: string;
  style?: JSX.CSSProperties;
}

/**
 * A progress clock drawn with conic gradients (design/handoff/README.md, "Clock").
 * Click ticks, right-click or shift-click unticks. A full clock gets the red ring.
 */
export function Clock({ size, filled, diameter = 58, onTick, title, class: cls, style }: ClockProps) {
  const seg = 360 / size;
  const deg = Math.max(0, Math.min(size, filled)) * seg;
  const full = filled >= size && size > 0;
  const face = `conic-gradient(var(--red) 0deg ${deg}deg, var(--clock-face) ${deg}deg 360deg)`;
  const dividers = `repeating-conic-gradient(from -1.5deg, var(--ink) 0deg 3deg, transparent 3deg ${seg}deg)`;
  return (
    <button
      type="button"
      class={`clock${cls ? ` ${cls}` : ''}`}
      title={title ?? `${filled} / ${size}`}
      aria-label={title ?? `clock ${filled} of ${size}`}
      style={{
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        border: '2.5px solid var(--ink)',
        padding: 0,
        flex: 'none',
        background: `${dividers}, ${face}`,
        boxShadow: full ? '0 0 0 3px rgba(140,47,27,0.35)' : '1px 1px 0 rgba(34,28,19,0.25)',
        cursor: onTick ? 'pointer' : 'default',
        ...style,
      }}
      onClick={(e) => {
        if (!onTick) return;
        onTick(e.shiftKey ? -1 : 1);
      }}
      onContextMenu={(e) => {
        if (!onTick) return;
        e.preventDefault();
        onTick(-1);
      }}
    />
  );
}
