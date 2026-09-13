import type { SceneClock } from '../../ledger/types';
import { useAutoFocus } from '../table/hooks';
import { useDraft } from './hooks';

/** Dial diameter (design/handoff-scene/README.md: 150 px) and the clock item's width, max(200, dial + 24). */
export const DIAL = 150;
export const CLOCK_W = Math.max(200, DIAL + 24);

export interface ClockHandlers {
  onDown(e: PointerEvent, id: string): void;
  /** True right after a drag that moved the item, so the click that follows it must not act. */
  dragged(): boolean;
  onTick(id: string, delta: 1 | -1): void;
  onCycle(id: string): void;
  onEditName(id: string): void;
  onName(id: string, name: string): void;
  onEditDone(id: string): void;
  onConfirmRemove(id: string): void;
}

export interface ClockItemProps {
  clock: SceneClock;
  selected: boolean;
  armed: boolean;
  editing: boolean;
  h: ClockHandlers;
}

/** A big progress clock on the Scene (README "Clock item"): dial, name, − count + row, armed tag. */
export function ClockItem({ clock: c, selected, armed, editing, h }: ClockItemProps) {
  const seg = 360 / c.size;
  const deg = Math.max(0, Math.min(c.size, c.filled)) * seg;
  const full = c.filled >= c.size && c.size > 0;
  const face = `conic-gradient(var(--red) 0deg ${deg}deg, var(--clock-face) ${deg}deg 360deg)`;
  const dividers = `repeating-conic-gradient(from -1deg, var(--ink) 0deg 2deg, transparent 2deg ${seg}deg)`;
  const ring = selected ? `0 0 0 2px ${armed ? 'var(--red)' : 'var(--ink)'}` : '';
  const shadow = [ring, full ? '0 0 0 4px rgba(140,47,27,0.35)' : '2px 2px 0 rgba(34,28,19,0.25)'].filter(Boolean).join(', ');

  return (
    <div class={`scene-item${selected ? ' sel' : ''}`} data-scene-id={c.id} style={{ left: c.x, top: c.y, width: CLOCK_W }} onPointerDown={(e) => h.onDown(e, c.id)}>
      <div class="scene-clock">
        <button
          type="button"
          class="scene-dial"
          data-grab="1"
          title={`${c.filled} of ${c.size} · click: tick · right-click: untick · drag: move`}
          aria-label={`clock ${c.filled} of ${c.size}`}
          style={{ width: DIAL, height: DIAL, background: `${dividers}, ${face}`, boxShadow: shadow }}
          onClick={(e) => {
            e.stopPropagation();
            if (h.dragged()) return;
            h.onTick(c.id, e.shiftKey ? -1 : 1);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            h.onTick(c.id, -1);
          }}
        />
        {editing ? (
          <NameEditor name={c.name} onCommit={(v) => h.onName(c.id, v)} onDone={() => h.onEditDone(c.id)} />
        ) : (
          <div
            class={`scene-clock-name${full ? ' full' : ''}`}
            title="click to rename"
            onClick={(e) => {
              e.stopPropagation();
              if (h.dragged()) return;
              h.onEditName(c.id);
            }}
          >
            {c.name}
          </div>
        )}
        <div class="scene-clock-ctl">
          <button
            type="button"
            class="scene-clock-btn minus"
            title="clear a slice"
            onClick={(e) => {
              e.stopPropagation();
              h.onTick(c.id, -1);
            }}
          >
            −
          </button>
          <button
            type="button"
            class={`scene-count${full ? ' full' : ''}`}
            title="segments — click to change (4 · 6 · 8 · 10 · 12)"
            onClick={(e) => {
              e.stopPropagation();
              h.onCycle(c.id);
            }}
          >
            {c.filled} / {c.size}
          </button>
          <button
            type="button"
            class="scene-clock-btn plus"
            title="fill a slice"
            onClick={(e) => {
              e.stopPropagation();
              h.onTick(c.id, 1);
            }}
          >
            +
          </button>
        </div>
      </div>
      {armed && (
        <button
          type="button"
          class="scene-armed"
          onClick={(e) => {
            e.stopPropagation();
            h.onConfirmRemove(c.id);
          }}
        >
          ✕ REMOVE — CLICK TO CONFIRM · ESC
        </button>
      )}
    </div>
  );
}

/** The 2-row name textarea: autofocused, Enter / Esc / blur close it (newlines become spaces). */
function NameEditor({ name, onCommit, onDone }: { name: string; onCommit: (v: string) => void; onDone: () => void }) {
  const ref = useAutoFocus<HTMLTextAreaElement>();
  const f = useDraft(name, onCommit, { clean: (v) => v.replace(/\n/g, ' ') });
  return (
    <textarea
      ref={ref}
      class="scene-clock-name-edit"
      rows={2}
      spellcheck={false}
      value={f.value}
      onInput={f.onInput}
      onKeyDown={f.onKeyDown}
      onBlur={() => {
        f.onBlur();
        onDone();
      }}
    />
  );
}
