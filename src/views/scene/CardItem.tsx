import { useEffect, useRef } from 'preact/hooks';
import type { SceneCard, SceneCardType } from '../../ledger/types';
import { useDraft } from './hooks';

export const CARD_W = 300;
/** ♟ person · ⌖ place · ✦ event / feature. */
export const CARD_GLYPH: Record<SceneCardType, string> = { npc: '♟', location: '⌖', other: '✦' };
export const NEXT_TYPE: Record<SceneCardType, SceneCardType> = { npc: 'location', location: 'other', other: 'npc' };

/** Four ruled lines at 26 px: the body never shrinks below this. */
const BODY_MIN_H = 104;
/** Browsers with `field-sizing: content` grow the body themselves; the others get a JS fallback. */
const GROWS_ITSELF = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('field-sizing', 'content');

export interface CardHandlers {
  onDown(e: PointerEvent, id: string): void;
  onCycleType(id: string): void;
  onTitle(id: string, title: string): void;
  onBody(id: string, body: string): void;
  onTitleDone(id: string): void;
  onConfirmRemove(id: string): void;
}

export interface CardItemProps {
  card: SceneCard;
  selected: boolean;
  armed: boolean;
  /** Focus the title as soon as the card mounts (a card just thrown down). */
  focusTitle: boolean;
  h: CardHandlers;
}

/** An index card on the Scene (README "Index card item"): red top rule, type glyph, title, ruled body. */
export function CardItem({ card: k, selected, armed, focusTitle, h }: CardItemProps) {
  const title = useDraft(k.title, (v) => h.onTitle(k.id, v));
  const body = useDraft(k.body, (v) => h.onBody(k.id, v), { multiline: true });
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusTitle) titleRef.current?.focus({ preventScroll: true });
  }, [focusTitle]);

  useEffect(() => {
    if (GROWS_ITSELF) return;
    const el = bodyRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(BODY_MIN_H, el.scrollHeight)}px`;
  }, [body.value]);

  const ring = selected ? `0 0 0 2px ${armed ? 'var(--red)' : 'var(--ink)'}, ` : '';

  return (
    <div class={`scene-item${selected ? ' sel' : ''}`} data-scene-id={k.id} style={{ left: k.x, top: k.y, width: CARD_W }} onPointerDown={(e) => h.onDown(e, k.id)}>
      <div class="scene-card" style={selected ? { boxShadow: `${ring}4px 4px 0 rgba(34,28,19,0.28)` } : undefined}>
        <div class="scene-card-head">
          <button
            type="button"
            class="scene-card-type"
            title="person · place · event — click to change"
            onClick={(e) => {
              e.stopPropagation();
              h.onCycleType(k.id);
            }}
          >
            {CARD_GLYPH[k.type] ?? '✦'}
          </button>
          <input
            ref={titleRef}
            class="scene-card-title"
            value={title.value}
            placeholder="name"
            spellcheck={false}
            onInput={title.onInput}
            onKeyDown={title.onKeyDown}
            onBlur={() => {
              title.onBlur();
              h.onTitleDone(k.id);
            }}
          />
        </div>
        <textarea ref={bodyRef} class="scene-card-body" rows={4} spellcheck={false} value={body.value} onInput={body.onInput} onKeyDown={body.onKeyDown} onBlur={body.onBlur} />
      </div>
      {armed && (
        <button
          type="button"
          class="scene-armed"
          onClick={(e) => {
            e.stopPropagation();
            h.onConfirmRemove(k.id);
          }}
        >
          ✕ REMOVE — CLICK TO CONFIRM · ESC
        </button>
      )}
    </div>
  );
}
