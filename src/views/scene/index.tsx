/**
 * The Scene: the shared surface for the moment of play. A fixed 1440 × 810 tabletop, scaled to
 * fit each viewer's window, carrying big progress clocks and index cards that everyone sees live.
 * Everything shown is derived from `ledger.scene.items` on every render; only UI state lives here
 * (selection, arming, the open radial, which text is being edited, the two-step sweep, a drag in
 * progress, the measured view size).
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { newId } from '../../ledger/ids';
import { crewNode } from '../../ledger/normalize';
import { cycleClockSize, tickClock } from '../../ledger/rules';
import type { Ledger, SceneCard, SceneClock, SceneItem } from '../../ledger/types';
import { useLedger } from '../../ui/context';
import { isTyping, setHint, SWEEP_EVENT, SWEEP_STATE_EVENT, useWindowEvent } from '../../ui/events';
import { addCustomNode, type Point } from '../table/actions';
import { RadialMenu, type RadialItem } from '../table/RadialMenu';
import { CardItem, NEXT_TYPE, type CardHandlers } from './CardItem';
import { ClockItem, type ClockHandlers } from './ClockItem';
import { inSceneControl } from './hooks';
import './scene.css';

/** The tabletop in table units: every browser shows the same arrangement, scaled to fit. */
export const WORLD_W = 1440;
export const WORLD_H = 810;

interface Drag {
  id: string;
  sx: number;
  sy: number;
  ox: number;
  oy: number;
  moved: boolean;
}
interface Radial {
  x: number; // canvas px
  y: number;
  wx: number; // world (table units)
  wy: number;
  id: string | null;
}
interface View {
  vw: number;
  vh: number;
}

const HINT_SWEEP = 'sweep the scene? click SWEEP again · esc keeps it';
const hintArmed = (kind: SceneItem['kind']) => `remove this ${kind}? click the red tag or press ⌫ again · esc keeps it`;
const FLASH_MS = 2500;
const NO_ITEMS: Record<string, SceneItem> = {};

/** Scale and centring offsets for a view size (`s = min(vw / 1440, vh / 810)`). */
function geometry(v: View): { s: number; ox: number; oy: number } {
  if (!v.vw || !v.vh) return { s: 1, ox: 0, oy: 0 };
  const s = Math.min(v.vw / WORLD_W, v.vh / WORLD_H);
  return { s, ox: (v.vw - WORLD_W * s) / 2, oy: (v.vh - WORLD_H * s) / 2 };
}

const itemsOf = (ledger: Ledger): Record<string, SceneItem> => ledger.scene?.items ?? NO_ITEMS;

export function SceneView() {
  const api = useLedger();
  const { ledger } = api;
  const surfaceRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  // ---- UI state
  const [view, setView] = useState<View>({ vw: 0, vh: 0 });
  const [selId, setSelId] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [radial, setRadial] = useState<Radial | null>(null);
  const [editing, setEditing] = useState<string | null>(null); // a clock id, or `<card id>:title`
  const [sweepArmed, setSweepArmed] = useState(false);
  const [flash, setFlash] = useState('');
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);

  const dragRef = useRef<Drag | null>(null);
  const justDragged = useRef(false);
  const flashTimer = useRef(0);

  // Latest values for handlers that live outside the render (window listeners).
  const latest = useRef({ api, view, selId, armed, radial, editing, sweepArmed });
  latest.current = { api, view, selId, armed, radial, editing, sweepArmed };

  // ---- derived from the ledger (a drag in progress overrides the dragged item's position)
  const stored = itemsOf(ledger);
  const items = useMemo<Record<string, SceneItem>>(() => {
    if (!dragPos || !stored[dragPos.id]) return stored;
    return { ...stored, [dragPos.id]: { ...stored[dragPos.id], x: dragPos.x, y: dragPos.y } };
  }, [stored, dragPos]);
  const ordered = useMemo(() => Object.values(items).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)), [items]);
  const sel = selId && items[selId] ? selId : null;
  const armedItem = armed && sel ? items[sel] : undefined;
  const geo = geometry(view);

  // ---- geometry helpers
  const canvasPoint = (e: { clientX: number; clientY: number }): Point => {
    const r = surfaceRef.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };
  const worldPoint = (e: { clientX: number; clientY: number }): Point => {
    const c = canvasPoint(e);
    const g = geometry(latest.current.view);
    return { x: (c.x - g.ox) / g.s, y: (c.y - g.oy) / g.s };
  };

  // ---- measure the view so the table scales to fit (ResizeObserver; one measurement on mount at least)
  useLayoutEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setView((v) => (v.vw === r.width && v.vh === r.height ? v : { vw: r.width, vh: r.height }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- ledger reads and writes (per-path patches; never mutate ledger objects)
  const clockOf = (id: string): SceneClock | undefined => {
    const it = itemsOf(latest.current.api.ledger)[id];
    return it?.kind === 'clock' ? it : undefined;
  };
  const cardOf = (id: string): SceneCard | undefined => {
    const it = itemsOf(latest.current.api.ledger)[id];
    return it?.kind === 'card' ? it : undefined;
  };
  const write = (id: string, field: string, value: unknown) => latest.current.api.update({ [`scene/items/${id}/${field}`]: value });

  const select = (id: string) => {
    setSelId(id);
    setArmed((a) => (id === latest.current.selId ? a : false));
  };
  const remove = (id: string) => {
    latest.current.api.update({ [`scene/items/${id}`]: null });
    setSelId((s) => (s === id ? null : s));
    setArmed(false);
    setRadial(null);
    setEditing((cur) => (cur === id || cur === `${id}:title` ? null : cur));
  };
  const add = (item: SceneItem, edit: string | null) => {
    latest.current.api.update({ [`scene/items/${item.id}`]: item });
    setSelId(item.id);
    setArmed(false);
    setRadial(null);
    setEditing(edit);
  };
  const addClock = (p: Point) => {
    const id = newId('s');
    add({ id, kind: 'clock', name: 'New clock', size: 6, filled: 0, x: Math.round(p.x - 100), y: Math.round(p.y - 90), createdAt: Date.now() }, id);
  };
  const addCard = (p: Point) => {
    const id = newId('s');
    add({ id, kind: 'card', type: 'other', title: '', body: '', x: Math.round(p.x - 150), y: Math.round(p.y - 80), createdAt: Date.now() }, `${id}:title`);
  };
  const showFlash = (text: string) => {
    window.clearTimeout(flashTimer.current);
    setFlash(text);
    flashTimer.current = window.setTimeout(() => setFlash(''), FLASH_MS);
  };
  /** TO TABLE: the card becomes a Table node near the crew card (type from its glyph, body as notes) and leaves the Scene. */
  const toTable = (id: string) => {
    const a = latest.current.api;
    const k = cardOf(id);
    if (!k) return;
    const crew = crewNode(a.ledger);
    const name = k.title.trim() || 'Untitled card';
    addCustomNode(a, k.type, name, crew ? { x: crew.x, y: crew.y } : undefined, { notes: k.body });
    remove(id);
    showFlash(`${name} moved to the Table`);
  };

  // ---- SWEEP: the header button dispatches; the Scene owns the two-step and tells the header when it is armed
  useWindowEvent(SWEEP_EVENT, () => {
    if (latest.current.sweepArmed) {
      latest.current.api.update({ 'scene/items': null });
      setSweepArmed(false);
      setSelId(null);
      setArmed(false);
      setRadial(null);
      setEditing(null);
    } else setSweepArmed(true);
  });
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(SWEEP_STATE_EVENT, { detail: sweepArmed }));
  }, [sweepArmed]);

  // ---- the red header hint (one source, so a flash is never clobbered by an arming change)
  const hintText = sweepArmed ? HINT_SWEEP : armedItem ? hintArmed(armedItem.kind) : flash;
  useEffect(() => {
    setHint(hintText);
  }, [hintText]);
  useEffect(
    () => () => {
      window.clearTimeout(flashTimer.current);
      window.dispatchEvent(new CustomEvent(SWEEP_STATE_EVENT, { detail: false }));
      setHint('');
    },
    [],
  );

  // ---- keyboard: Esc closes the innermost thing (text edit → radial → sweep armed → selection);
  //      Delete / Backspace arms the selected item, then removes it
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const S = latest.current;
      const typing = isTyping(e.target);
      if (e.key === 'Escape') {
        if (typing) {
          (e.target as HTMLElement).blur?.();
          if (S.editing) setEditing(null);
          return;
        }
        if (S.editing) {
          setEditing(null);
          return;
        }
        if (S.radial) {
          setRadial(null);
          return;
        }
        if (S.sweepArmed) {
          setSweepArmed(false);
          return;
        }
        setSelId(null);
        setArmed(false);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && S.selId && itemsOf(S.api.ledger)[S.selId]) {
        e.preventDefault();
        if (S.armed) remove(S.selId);
        else setArmed(true);
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- pointer: item drags run on window listeners until the pointer lifts (4 px threshold, write on drop)
  const onDragMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const s = geometry(latest.current.view).s;
    setDragPos({ id: d.id, x: Math.round(d.ox + dx / s), y: Math.round(d.oy + dy / s) });
  };
  const onDragUp = (e: PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    justDragged.current = d.moved;
    setDragPos(null);
    if (d.moved) {
      const s = geometry(latest.current.view).s;
      const x = Math.round(d.ox + (e.clientX - d.sx) / s);
      const y = Math.round(d.oy + (e.clientY - d.sy) / s);
      if (itemsOf(latest.current.api.ledger)[d.id]) latest.current.api.update({ [`scene/items/${d.id}/x`]: x, [`scene/items/${d.id}/y`]: y });
    } else select(d.id);
  };
  const beginDrag = (id: string, e: PointerEvent) => {
    const it = itemsOf(latest.current.api.ledger)[id];
    if (!it) return;
    justDragged.current = false;
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: it.x, oy: it.y, moved: false };
    const move = (ev: PointerEvent) => onDragMove(ev);
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      onDragUp(ev);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    setRadial(null);
  };

  const onSurfaceDown = (e: PointerEvent) => {
    if (e.button === 2 || inSceneControl(e.target)) return;
    if (latest.current.radial) {
      setRadial(null);
      return;
    }
    setSelId(null);
    setArmed(false);
  };
  const onSurfaceMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const itemEl = (e.target as HTMLElement).closest?.('[data-scene-id]');
    const c = canvasPoint(e);
    const w = worldPoint(e);
    dragRef.current = null;
    setRadial({ x: c.x, y: c.y, wx: w.x, wy: w.y, id: itemEl?.getAttribute('data-scene-id') ?? null });
    setEditing(null);
  };
  const onSurfaceDbl = (e: MouseEvent) => {
    if (e.target !== worldRef.current) return;
    addCard(worldPoint(e));
  };
  const onItemDown = (e: PointerEvent, id: string) => {
    if (e.button === 2 || inSceneControl(e.target)) return;
    e.stopPropagation();
    beginDrag(id, e);
  };

  // ---- item handlers
  const clockH: ClockHandlers = {
    onDown: onItemDown,
    dragged: () => justDragged.current,
    onTick(id, delta) {
      const c = clockOf(id);
      if (c) write(id, 'filled', tickClock(c, delta).filled);
    },
    onCycle(id) {
      const c = clockOf(id);
      if (!c) return;
      const n = cycleClockSize(c);
      latest.current.api.update({ [`scene/items/${id}/size`]: n.size, [`scene/items/${id}/filled`]: n.filled });
    },
    onEditName(id) {
      setEditing(id);
      setSelId(id);
      setArmed(false);
    },
    onName(id, name) {
      if (clockOf(id)) write(id, 'name', name);
    },
    onEditDone(id) {
      setEditing((cur) => (cur === id ? null : cur));
    },
    onConfirmRemove: remove,
  };
  const cardH: CardHandlers = {
    onDown: onItemDown,
    onCycleType(id) {
      const k = cardOf(id);
      if (k) write(id, 'type', NEXT_TYPE[k.type] ?? 'npc');
    },
    onTitle(id, title) {
      if (cardOf(id)) write(id, 'title', title);
    },
    onBody(id, body) {
      if (cardOf(id)) write(id, 'body', body);
    },
    onTitleDone(id) {
      setEditing((cur) => (cur === `${id}:title` ? null : cur));
    },
    onConfirmRemove: remove,
  };

  // ---- radial menu: on the empty surface it adds; on an item it acts on that item
  const target = radial?.id ? items[radial.id] : undefined;
  const arm = (id: string) => () => {
    setSelId(id);
    setArmed(true);
  };
  const radialItems: RadialItem[] = !radial
    ? []
    : !target
      ? [
          { glyph: '◔', label: 'CLOCK', act: () => addClock({ x: radial.wx, y: radial.wy }) },
          { glyph: '▭', label: 'CARD', act: () => addCard({ x: radial.wx, y: radial.wy }) },
        ]
      : target.kind === 'clock'
        ? [
            { glyph: '↺', label: 'RESET', act: () => write(target.id, 'filled', 0) },
            { glyph: '✕', label: 'REMOVE', danger: true, act: arm(target.id) },
          ]
        : [
            { glyph: '⤢', label: 'TO TABLE', act: () => toTable(target.id) },
            { glyph: '✕', label: 'REMOVE', danger: true, act: arm(target.id) },
          ];

  return (
    <div ref={surfaceRef} class="scene" onPointerDown={onSurfaceDown} onContextMenu={onSurfaceMenu} onDblClick={onSurfaceDbl}>
      <div ref={worldRef} class="scene-world" style={{ width: WORLD_W, height: WORLD_H, transform: `translate(${geo.ox}px,${geo.oy}px) scale(${geo.s})` }}>
        {ordered.map((it) =>
          it.kind === 'clock' ? (
            <ClockItem key={it.id} clock={it} selected={sel === it.id} armed={sel === it.id && armed} editing={editing === it.id} h={clockH} />
          ) : (
            <CardItem key={it.id} card={it} selected={sel === it.id} armed={sel === it.id && armed} focusTitle={editing === `${it.id}:title`} h={cardH} />
          ),
        )}
      </div>
      {radial && <RadialMenu x={radial.x} y={radial.y} items={radialItems} onPick={() => setRadial(null)} />}
    </div>
  );
}
