import type { JSX } from 'preact';
import { statusBand, statusInk, statusTint, tierWeight } from '../../ledger/rules';
import type { Clock as ClockRec, Side, TableNode } from '../../ledger/types';
import { Clock } from '../../ui/Clock';
import { GLYPH, TYPE_TAG } from './actions';
import { inControl, useAutoFocus, useMeasuredHeight } from './hooks';

const SIDES: Side[] = ['n', 's', 'e', 'w'];

export interface CardHandlers {
  onNodeDown(e: PointerEvent, id: string): void;
  onPortDown(e: PointerEvent, id: string, side: Side): void;
  onOpen(id: string): void;
  onHeight(id: string, h: number): void;
  onTick(nodeId: string, clockId: string, delta: 1 | -1): void;
  onCycle(nodeId: string, clockId: string): void;
  onRenameClock(nodeId: string, clockId: string, name: string): void;
  onRemoveClock(nodeId: string, clockId: string): void;
  onAddClock(nodeId: string): void;
  onFocusClock(nodeId: string, clockId: string | null): void;
  onStatus(nodeId: string, delta: 1 | -1): void;
  onConfirmDelete(nodeId: string): void;
}

export interface CardProps {
  node: TableNode;
  /** Card width (nodeWidth) and last measured height (for the top offset). */
  width: number;
  height: number;
  /** Name / tier shown (the crew card takes them from the ledger's crew + crew sheet). */
  name: string;
  tier: string;
  line: string;
  selected: boolean;
  armed: boolean;
  focusClock: string | null;
  /** Clocks are GM-only on the Network view; players get cards without the clocks block. */
  showClocks?: boolean;
  h: CardHandlers;
}

/** One Table card (design/handoff/README.md, "Card"). */
export function Card({ node, width, height, name, tier, line, selected, armed, focusClock, showClocks = true, h }: CardProps) {
  const isCrew = node.type === 'crew';
  const st = Math.max(-3, Math.min(3, node.status));
  const tw = tierWeight(tier);
  const lineInk = isCrew || st === 0 ? 'var(--ink)' : statusInk(st);
  const ref = useMeasuredHeight<HTMLDivElement>(node.id, h.onHeight);
  const showBand = !isCrew && (st !== 0 || (node.type !== 'district' && node.type !== 'location'));
  const clocks = Object.values(node.clocks ?? {});

  const outer: JSX.CSSProperties = {
    left: node.x - width / 2,
    top: node.y - height / 2,
    width,
    zIndex: selected ? 5 : isCrew ? 4 : 2,
  };
  const inner: JSX.CSSProperties = {
    background: isCrew ? 'var(--ink)' : statusTint(st),
    color: isCrew ? 'var(--paper)' : 'var(--ink)',
    borderWidth: tw.border,
    borderColor: lineInk,
    boxShadow: `${selected ? `0 0 0 2px ${armed ? 'var(--red)' : 'var(--ink)'}, ` : ''}${tw.shadow}px ${tw.shadow}px 0 rgba(34,28,19,${tw.alpha})`,
  };

  return (
    <div
      ref={ref}
      class={`card-wrap${selected ? ' sel' : ''}`}
      data-node-id={node.id}
      style={outer}
      onPointerDown={(e) => h.onNodeDown(e, node.id)}
      onDblClick={(e) => {
        if (inControl(e.target, '[data-port]')) return;
        h.onOpen(node.id);
      }}
    >
      <div class={`card${isCrew ? ' crew' : ''}`} style={inner}>
        <div class="card-head">
          <span class="card-glyph" title={TYPE_TAG[node.type]}>
            {GLYPH[node.type] ?? '✦'}
          </span>
          {tier && (
            <span class="card-tier" title="Tier">
              {tier}
            </span>
          )}
          <span style={{ flex: 1 }} />
          <button
            type="button"
            class="card-open"
            title="Open the dossier (or double-click the card)"
            onClick={(e) => {
              e.stopPropagation();
              h.onOpen(node.id);
            }}
          >
            ⤢
          </button>
        </div>
        <div class="card-name">{name}</div>
        {line && <div class="card-line">{line}</div>}
        {showClocks && (
        <div class="card-clocks">
          {clocks.map((c) => (
            <ClockRow key={c.id} node={node} clock={c} editing={focusClock === c.id} h={h} />
          ))}
          <button
            type="button"
            class="clock-add"
            title="Start a new clock on this card"
            onClick={(e) => {
              e.stopPropagation();
              h.onAddClock(node.id);
            }}
          >
            ◔ + CLOCK
          </button>
        </div>
        )}
        {showBand && (
          <button
            type="button"
            class="card-band"
            title="Status with the crew — click: warmer · right-click: colder"
            style={{ background: statusInk(st) }}
            onClick={(e) => {
              e.stopPropagation();
              h.onStatus(node.id, 1);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              h.onStatus(node.id, -1);
            }}
          >
            {statusBand(st)}
          </button>
        )}
      </div>
      {SIDES.map((side) => (
        <div key={side} class={`port ${side}`} data-port={side} title="Drag to connect" onPointerDown={(e) => h.onPortDown(e, node.id, side)} />
      ))}
      {armed && (
        <button
          type="button"
          class="card-armed"
          onClick={(e) => {
            e.stopPropagation();
            h.onConfirmDelete(node.id);
          }}
        >
          ✕ REMOVE — CLICK TO CONFIRM · ESC
        </button>
      )}
    </div>
  );
}

function ClockRow({ node, clock: c, editing, h }: { node: TableNode; clock: ClockRec; editing: boolean; h: CardHandlers }) {
  const full = c.filled >= c.size;
  const stop = (e: Event) => e.stopPropagation();
  return (
    <div class="clock-row">
      <span onContextMenu={stop} onClick={stop} style={{ display: 'inline-flex', flex: 'none' }}>
        <Clock
          size={c.size}
          filled={c.filled}
          diameter={58}
          title={`${c.name} — ${c.filled} of ${c.size} · click: tick · right-click: untick`}
          onTick={(d) => h.onTick(node.id, c.id, d)}
        />
      </span>
      <div class="clock-body">
        {editing ? (
          <ClockNameEditor value={c.name} onInput={(v) => h.onRenameClock(node.id, c.id, v)} onDone={() => h.onFocusClock(node.id, null)} />
        ) : (
          <div
            class={`clock-name${full ? ' full' : ''}`}
            title="Clock name — click to edit"
            onClick={(e) => {
              e.stopPropagation();
              h.onFocusClock(node.id, c.id);
            }}
          >
            {c.name}
          </div>
        )}
        <div class="clock-ctl">
          <button
            type="button"
            class={`clock-count${full ? ' full' : ''}`}
            title="Segments — click to change (4 · 6 · 8 · 10 · 12)"
            onClick={(e) => {
              e.stopPropagation();
              h.onCycle(node.id, c.id);
            }}
          >
            {c.filled} / {c.size}
          </button>
          <button
            type="button"
            class="clock-btn plus"
            title="Fill a slice"
            onClick={(e) => {
              e.stopPropagation();
              h.onTick(node.id, c.id, 1);
            }}
          >
            +
          </button>
          <button
            type="button"
            class="clock-btn minus"
            title="Clear a slice"
            onClick={(e) => {
              e.stopPropagation();
              h.onTick(node.id, c.id, -1);
            }}
          >
            −
          </button>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            class="clock-del"
            title="Remove clock"
            onClick={(e) => {
              e.stopPropagation();
              h.onRemoveClock(node.id, c.id);
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function ClockNameEditor({ value, onInput, onDone }: { value: string; onInput: (v: string) => void; onDone: () => void }) {
  const ref = useAutoFocus<HTMLTextAreaElement>();
  return (
    <textarea
      ref={ref}
      class="clock-name-edit"
      rows={2}
      spellcheck={false}
      value={value}
      onInput={(e) => onInput((e.currentTarget as HTMLTextAreaElement).value.replace(/\n/g, ' '))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          (e.currentTarget as HTMLTextAreaElement).blur();
        }
      }}
      onBlur={onDone}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}
