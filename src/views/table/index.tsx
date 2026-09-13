/**
 * The Table: a pan/zoom map of everything in play. Cards are DOM, edges are one SVG layer
 * beneath them. Everything shown is derived from the ledger on every render; only UI state
 * (selection, pan/zoom, open menus, which field is being edited) lives here.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { crewType, roman, type BookKind } from '../../data';
import { cycleClockSize, edgeTone, newClock, nodeWidth, oneLine, tickClock } from '../../ledger/rules';
import type { Clock, Side, TableNode } from '../../ledger/types';
import { useLedger } from '../../ui/context';
import { BOOK_EVENT, FIT_EVENT, isTyping, setHint, useWindowEvent } from '../../ui/events';
import {
  addBookNode,
  addCustomNode,
  addRelated,
  autoLink,
  bookEntryOf,
  CENTRE_EVENT,
  connectEdge,
  CUSTOM_NAMES,
  deleteNodePatch,
  GLYPH,
  nodeForEntry,
  relatedOf,
  type BookRow,
  type Point,
} from './actions';
import { BookDialog } from './BookDialog';
import { Card, type CardHandlers } from './Card';
import { Dossier } from './Dossier';
import { EdgeLabels, EdgeSvg, type EdgeView } from './EdgeLayer';
import {
  canvasToWorld,
  centreOnPoint,
  DEFAULT_CARD_H,
  edgeGeometry,
  edgeLanes,
  fitTransform,
  linePath,
  portPoint,
  relatedPopoverPosition,
  zoomAround,
  type Box,
  type Pan,
} from './geometry';
import { inControl } from './hooks';
import { RadialMenu, type RadialItem } from './RadialMenu';
import { RelatedPopover, type RelatedRow } from './RelatedPopover';
import './table.css';

type Drag =
  | { type: 'pan'; sx: number; sy: number; ox: number; oy: number; moved: boolean }
  | { type: 'node'; id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean }
  | { type: 'edge'; fromId: string; fromSide: Side; x: number; y: number };

interface Radial {
  x: number; // canvas px
  y: number;
  wx: number; // world
  wy: number;
  nodeId: string | null;
}
interface Linking {
  fromId: string;
  x: number;
  y: number;
}
interface BookState {
  open: boolean;
  tab: BookKind;
  at: Point | null;
}
interface EdgeDrag {
  fromId: string;
  fromSide: Side;
  x: number;
  y: number;
}

const HINT_LINK = 'click a card to connect · esc cancels';
const HINT_ARMED = 'remove this card? click the red tag or press ⌫ again · esc keeps it';

export function TableView() {
  const api = useLedger();
  const showClocks = api.role === 'gm'; // decision 0003: Network clocks are GM-only
  const { ledger } = api;
  const canvasRef = useRef<HTMLDivElement>(null);

  // ---- UI state
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0, s: 1 });
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [selId, setSelId] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);
  const [editEdge, setEditEdge] = useState<string | null>(null);
  const [focusClock, setFocusClock] = useState<string | null>(null);
  const [radial, setRadial] = useState<Radial | null>(null);
  const [related, setRelated] = useState<string | null>(null);
  const [linking, setLinking] = useState<Linking | null>(null);
  const [dossier, setDossier] = useState<string | null>(null);
  const [book, setBook] = useState<BookState>({ open: false, tab: 'faction', at: null });
  const [panning, setPanning] = useState(false);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);
  const [edgeDrag, setEdgeDrag] = useState<EdgeDrag | null>(null);

  const dragRef = useRef<Drag | null>(null);
  const touched = useRef<Record<string, number>>({});
  const refitDone = useRef(false);

  // Latest values for handlers that live outside the render (window listeners).
  const latest = useRef({ api, pan, sizes, selId, armed, editEdge, focusClock, radial, related, linking, dossier, book });
  latest.current = { api, pan, sizes, selId, armed, editEdge, focusClock, radial, related, linking, dossier, book };

  // ---- derived from the ledger
  const sel = selId && ledger.nodes[selId] ? selId : null;
  const nodes = useMemo(() => {
    if (!dragPos || !ledger.nodes[dragPos.id]) return ledger.nodes;
    return { ...ledger.nodes, [dragPos.id]: { ...ledger.nodes[dragPos.id], x: dragPos.x, y: dragPos.y } };
  }, [ledger.nodes, dragPos]);
  const crewSheet = ledger.sheets.crew;
  const crewTypeName = crewType(crewSheet.type)?.name;
  const crewTier = crewSheet.type ? roman(crewSheet.tier) : null;
  const boxOf = (n: TableNode): Box => ({ x: n.x, y: n.y, w: nodeWidth(n.type), h: sizes[n.id] ?? DEFAULT_CARD_H });

  const edgeList = Object.values(ledger.edges).filter((e) => nodes[e.from] && nodes[e.to]);
  const lanes = edgeLanes(edgeList);
  const edgeViews: EdgeView[] = edgeList.map((e) => {
    const g = edgeGeometry(boxOf(nodes[e.from]), boxOf(nodes[e.to]), e, lanes.get(e.id) ?? 0);
    return { edge: e, d: g.d, label: g.label, tone: edgeTone(e.label), editing: editEdge === e.id };
  });

  // ---- helpers
  const canvasSize = () => {
    const el = canvasRef.current;
    return { w: el?.clientWidth || 1200, h: el?.clientHeight || 700 };
  };
  const canvasPoint = (e: { clientX: number; clientY: number }): Point => {
    const r = canvasRef.current?.getBoundingClientRect();
    return { x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) };
  };
  const worldPoint = (e: { clientX: number; clientY: number }): Point => canvasToWorld(canvasPoint(e), latest.current.pan);
  const centreWorld = (): Point => {
    const { w, h } = canvasSize();
    return canvasToWorld({ x: w / 2, y: h / 2 }, latest.current.pan);
  };
  const scatter = (p: Point): Point => ({ x: Math.round(p.x + Math.random() * 160 - 80), y: Math.round(p.y + Math.random() * 120 - 60) });
  const touch = (id: string) => (touched.current[id] = Date.now());
  const closeOverlays = () => {
    setRadial(null);
    setRelated(null);
    setLinking(null);
  };
  const select = (id: string | null) => {
    setSelId(id);
    setArmed((a) => (id && id === latest.current.selId ? a : false));
    setEditEdge(null);
  };
  const centreOnNode = (n: TableNode) => {
    const { w, h } = canvasSize();
    setPan((p) => centreOnPoint(n, p, w, h));
  };

  const fit = useCallback(() => {
    const el = canvasRef.current;
    if (!el || !el.clientWidth) return;
    const { api: a, sizes: sz } = latest.current;
    const boxes = Object.values(a.ledger.nodes).map((n) => ({ x: n.x, y: n.y, w: nodeWidth(n.type), h: sz[n.id] ?? DEFAULT_CARD_H }));
    setPan(fitTransform(boxes, el.clientWidth, el.clientHeight));
  }, []);

  // ---- ledger writes
  const writeClock = (nodeId: string, c: Clock) => latest.current.api.update({ [`nodes/${nodeId}/clocks/${c.id}`]: c });
  const addClockTo = (nodeId: string, focus = true) => {
    const c = newClock('New clock', 6);
    touch(nodeId);
    writeClock(nodeId, c);
    if (focus) {
      setFocusClock(c.id);
      setSelId(nodeId);
      setArmed(false);
    }
  };
  const removeNode = (id: string) => {
    const { api: a } = latest.current;
    a.update(deleteNodePatch(a.ledger, id));
    setSelId((s) => (s === id ? null : s));
    setArmed(false);
    setDossier((d) => (d === id ? null : d));
    setRelated((r) => (r === id ? null : r));
  };
  const connect = (from: string, to: string, fromSide?: Side, toSide?: Side) => {
    const id = connectEdge(latest.current.api, from, to, fromSide, toSide);
    if (id) {
      setEditEdge(id);
      setSelId(null);
      setArmed(false);
    }
  };
  const openDossier = (id: string) => {
    setDossier(id);
    setSelId(id);
    setArmed(false);
    closeOverlays();
    setEditEdge(null);
    setFocusClock(null);
  };
  const openBook = (tab: BookKind, at: Point | null) => {
    setBook({ open: true, tab, at });
    setRadial(null);
    setRelated(null);
  };
  const closeBook = useCallback(() => setBook((b) => ({ ...b, open: false })), []);
  const addFromBook = (row: BookRow) => {
    const { api: a, book: B } = latest.current;
    if (row.node) {
      select(row.node.id);
      centreOnNode(row.node);
      closeBook();
      return;
    }
    const n = addBookNode(a, row.kind, row.ref, B.at ?? scatter(centreWorld()));
    closeBook();
    if (!n) return;
    autoLink(a, n);
    setSelId(n.id);
    setArmed(false);
  };
  const addCustom = (type: TableNode['type'], at: Point | null) => {
    const n = addCustomNode(latest.current.api, type, CUSTOM_NAMES[type], at ?? scatter(centreWorld()));
    closeBook();
    openDossier(n.id);
  };
  const startLinking = (fromId: string, at: Point) => {
    setLinking({ fromId, x: at.x, y: at.y });
    setSelId(fromId);
    setArmed(false);
    setDossier(null);
    setRadial(null);
    setRelated(null);
  };

  // ---- measured heights (cards grow with their clocks; a locally caused growth keeps the top edge still)
  const onHeight = useCallback((id: string, h: number) => {
    const { api: a, sizes: sz } = latest.current;
    const old = sz[id];
    if (old !== undefined && Math.abs(old - h) < 0.5) return;
    setSizes((prev) => (prev[id] !== undefined && Math.abs(prev[id] - h) < 0.5 ? prev : { ...prev, [id]: h }));
    const n = a.ledger.nodes[id];
    if (old && n && !dragRef.current && Date.now() - (touched.current[id] ?? 0) < 1500) {
      a.update({ [`nodes/${id}/y`]: Math.round((n.y + (h - old) / 2) * 10) / 10 });
    }
  }, []);

  // ---- fit: on mount, again once every card has been measured, and on the header's FIT
  useLayoutEffect(() => {
    fit();
  }, [fit]);
  useEffect(() => {
    if (refitDone.current) return;
    const ids = Object.keys(latest.current.api.ledger.nodes);
    if (ids.length && ids.every((id) => sizes[id] !== undefined)) {
      refitDone.current = true;
      fit();
    }
  }, [sizes, fit]);
  useWindowEvent(FIT_EVENT, fit);
  useWindowEvent(BOOK_EVENT, () => openBook(latest.current.book.tab, null));
  useWindowEvent<string>(CENTRE_EVENT, (id) => {
    const n = latest.current.api.ledger.nodes[id];
    if (!n) return;
    centreOnNode(n);
    setSelId(id);
    setArmed(false);
  });

  // ---- the red header hint
  const armedNow = armed && !!sel && !dossier;
  useEffect(() => {
    setHint(linking ? HINT_LINK : armedNow ? HINT_ARMED : '');
  }, [linking, armedNow]);
  useEffect(() => () => setHint(''), []);

  // ---- keyboard: Esc closes the innermost thing; Delete arms then removes the selected card
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const S = latest.current;
      const typing = isTyping(e.target);
      if (e.key === 'Escape') {
        if (typing) (e.target as HTMLElement).blur?.();
        if (S.editEdge) {
          setEditEdge(null);
          return;
        }
        if (S.focusClock) {
          setFocusClock(null);
          return;
        }
        if (S.radial || S.related || S.linking) {
          setRadial(null);
          setRelated(null);
          setLinking(null);
          return;
        }
        setSelId(null);
        setArmed(false);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && S.selId && S.api.ledger.nodes[S.selId] && !S.dossier && !S.book.open) {
        e.preventDefault();
        if (S.armed) removeNode(S.selId);
        else setArmed(true);
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- pointer: pans, card drags and edge drags run on window listeners until the pointer lifts
  const onDragMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    if (d.type === 'edge') {
      const p = worldPoint(e);
      d.x = p.x;
      d.y = p.y;
      setEdgeDrag({ fromId: d.fromId, fromSide: d.fromSide, x: p.x, y: p.y });
      return;
    }
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const s = latest.current.pan.s;
    if (d.type === 'pan') setPan({ x: d.ox + dx, y: d.oy + dy, s });
    else setDragPos({ id: d.id, x: d.ox + dx / s, y: d.oy + dy / s });
  };
  const onDragUp = (e: PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    setPanning(false);
    if (!d) return;
    if (d.type === 'edge') {
      setEdgeDrag(null);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const nodeEl = el?.closest('[data-node-id]');
      const toId = nodeEl?.getAttribute('data-node-id');
      if (toId && toId !== d.fromId) {
        const toSide = (el?.closest('[data-port]')?.getAttribute('data-port') as Side | null) ?? undefined;
        connect(d.fromId, toId, d.fromSide, toSide);
      }
      return;
    }
    if (d.type === 'node') {
      setDragPos(null);
      if (d.moved) {
        const s = latest.current.pan.s;
        const x = Math.round(d.ox + (e.clientX - d.sx) / s);
        const y = Math.round(d.oy + (e.clientY - d.sy) / s);
        if (latest.current.api.ledger.nodes[d.id]) latest.current.api.update({ [`nodes/${d.id}/x`]: x, [`nodes/${d.id}/y`]: y });
      } else select(d.id);
      return;
    }
    if (!d.moved) {
      setSelId(null);
      setArmed(false);
      setEditEdge(null);
    }
  };
  const beginDrag = (d: Drag) => {
    dragRef.current = d;
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
  };

  const onCanvasDown = (e: PointerEvent) => {
    if (e.button === 2 || inControl(e.target)) return;
    const S = latest.current;
    if (S.linking || S.radial || S.related) {
      closeOverlays();
      return;
    }
    beginDrag({ type: 'pan', sx: e.clientX, sy: e.clientY, ox: S.pan.x, oy: S.pan.y, moved: false });
    setPanning(true);
  };
  const onCanvasMove = (e: PointerEvent) => {
    const L = latest.current.linking;
    if (L && !dragRef.current) {
      const p = worldPoint(e);
      setLinking({ ...L, x: p.x, y: p.y });
    }
  };
  const onCanvasMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nodeEl = (e.target as HTMLElement).closest?.('[data-node-id]');
    const c = canvasPoint(e);
    const w = canvasToWorld(c, latest.current.pan);
    dragRef.current = null;
    setRadial({ x: c.x, y: c.y, wx: w.x, wy: w.y, nodeId: nodeEl?.getAttribute('data-node-id') ?? null });
    setRelated(null);
    setLinking(null);
    setEditEdge(null);
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (latest.current.radial || latest.current.related) {
      setRadial(null);
      setRelated(null);
    }
    const c = canvasPoint(e);
    setPan((p) => zoomAround(p, e.deltaY < 0 ? 1.12 : 1 / 1.12, c.x, c.y));
  };

  // ---- card handlers
  const cardHandlers: CardHandlers = {
    onNodeDown(e, id) {
      if (inControl(e.target, '[data-port]')) return;
      e.stopPropagation();
      if (e.button === 2) return;
      const S = latest.current;
      if (S.linking) {
        if (S.linking.fromId !== id) connect(S.linking.fromId, id);
        closeOverlays();
        return;
      }
      const n = S.api.ledger.nodes[id];
      if (!n) return;
      setRadial(null);
      setRelated(null);
      beginDrag({ type: 'node', id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, moved: false });
    },
    onPortDown(e, id, side) {
      e.stopPropagation();
      e.preventDefault();
      if (e.button === 2) return;
      const n = latest.current.api.ledger.nodes[id];
      if (!n) return;
      const p = portPoint({ x: n.x, y: n.y, w: nodeWidth(n.type), h: latest.current.sizes[id] ?? DEFAULT_CARD_H }, side);
      beginDrag({ type: 'edge', fromId: id, fromSide: side, x: p.x, y: p.y });
      setEdgeDrag({ fromId: id, fromSide: side, x: p.x, y: p.y });
      setSelId(null);
      setEditEdge(null);
      setRadial(null);
      setRelated(null);
    },
    onOpen: openDossier,
    onHeight,
    onTick(nodeId, clockId, delta) {
      const c = latest.current.api.ledger.nodes[nodeId]?.clocks[clockId];
      if (c) writeClock(nodeId, tickClock(c, delta));
    },
    onCycle(nodeId, clockId) {
      const c = latest.current.api.ledger.nodes[nodeId]?.clocks[clockId];
      if (c) writeClock(nodeId, cycleClockSize(c));
    },
    onRenameClock(nodeId, clockId, name) {
      touch(nodeId);
      latest.current.api.update({ [`nodes/${nodeId}/clocks/${clockId}/name`]: name });
    },
    onRemoveClock(nodeId, clockId) {
      touch(nodeId);
      latest.current.api.update({ [`nodes/${nodeId}/clocks/${clockId}`]: null });
    },
    onAddClock(nodeId) {
      addClockTo(nodeId, true);
    },
    onFocusClock(nodeId, clockId) {
      touch(nodeId);
      if (clockId) {
        setFocusClock(clockId);
        setSelId(nodeId);
        setArmed(false);
      } else setFocusClock(null);
    },
    onStatus(nodeId, delta) {
      const n = latest.current.api.ledger.nodes[nodeId];
      if (!n) return;
      touch(nodeId);
      latest.current.api.update({ [`nodes/${nodeId}/status`]: Math.max(-3, Math.min(3, n.status + delta)) });
    },
    onConfirmDelete: removeNode,
  };

  // ---- radial menu items
  const radialNode = radial?.nodeId ? nodes[radial.nodeId] : undefined;
  const radialItems: RadialItem[] = radial
    ? radialNode
      ? [
          { glyph: '⤢', label: 'DOSSIER', act: () => openDossier(radialNode.id) },
          { glyph: '⤝', label: 'CONNECT', act: () => startLinking(radialNode.id, { x: radial.wx, y: radial.wy }) },
          ...(bookEntryOf(radialNode)
            ? [
                {
                  glyph: '✦',
                  label: 'RELATED',
                  act: () => {
                    setRelated(radialNode.id);
                    setSelId(radialNode.id);
                    setArmed(false);
                  },
                },
              ]
            : []),
          ...(showClocks ? [{ glyph: '◔', label: 'CLOCK', act: () => addClockTo(radialNode.id, true) }] : []),
          {
            glyph: '✕',
            label: 'REMOVE',
            danger: true,
            act: () => {
              setSelId(radialNode.id);
              setArmed(true);
            },
          },
        ]
      : [
          { glyph: GLYPH.faction, label: 'FACTION', act: () => openBook('faction', { x: radial.wx, y: radial.wy }) },
          { glyph: GLYPH.npc, label: 'NPC', act: () => openBook('npc', { x: radial.wx, y: radial.wy }) },
          { glyph: GLYPH.location, label: 'PLACE', act: () => openBook('location', { x: radial.wx, y: radial.wy }) },
          { glyph: GLYPH.district, label: 'DISTRICT', act: () => openBook('district', { x: radial.wx, y: radial.wy }) },
          { glyph: '✚', label: 'CUSTOM', act: () => addCustom('other', { x: radial.wx, y: radial.wy }) },
        ]
    : [];

  // ---- RELATED popover
  const relatedNode = related ? nodes[related] : undefined;
  let relatedRows: RelatedRow[] = [];
  let relatedPos: Point = { x: 0, y: 0 };
  if (relatedNode) {
    relatedRows = relatedOf(relatedNode).map((item) => {
      const ex = nodeForEntry(nodes, item.kind, item.ref);
      const linked = !!ex && edgeList.some((e) => (e.from === relatedNode.id && e.to === ex.id) || (e.to === relatedNode.id && e.from === ex.id));
      return { item, action: linked ? 'linked' : ex ? 'link' : 'add' };
    });
    const { w, h } = canvasSize();
    relatedPos = relatedPopoverPosition(boxOf(relatedNode), pan, w, h);
  }

  // ---- dashed lines while drawing / linking
  const dragFrom = edgeDrag ? nodes[edgeDrag.fromId] : undefined;
  const dragPath = edgeDrag && dragFrom ? linePath(portPoint(boxOf(dragFrom), edgeDrag.fromSide), edgeDrag) : undefined;
  const linkFrom = linking ? nodes[linking.fromId] : undefined;
  const linkPath = linking && linkFrom ? linePath(linkFrom, linking) : undefined;

  const dossierNode = dossier ? ledger.nodes[dossier] : undefined;
  const canvasClass = `tbl${linking ? ' linking' : edgeDrag ? ' drawing' : panning ? ' panning' : ''}`;

  return (
    <>
      <div ref={canvasRef} class={canvasClass} onPointerDown={onCanvasDown} onPointerMove={onCanvasMove} onWheel={onWheel} onContextMenu={onCanvasMenu}>
        <div class="tbl-world" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${pan.s})` }}>
          <EdgeSvg
            edges={edgeViews}
            dragPath={dragPath}
            linkPath={linkPath}
            onEdgeClick={(id) => {
              setEditEdge(id);
              setSelId(null);
              setArmed(false);
              setRadial(null);
              setRelated(null);
            }}
          />
          <EdgeLabels
            edges={edgeViews}
            h={{
              onEdit: (id) => {
                setEditEdge(id);
                setSelId(null);
                setArmed(false);
                setRadial(null);
                setRelated(null);
              },
              onLabel: (id, label) => latest.current.api.update({ [`edges/${id}/label`]: label }),
              onDelete: (id) => {
                latest.current.api.update({ [`edges/${id}`]: null });
                setEditEdge((cur) => (cur === id ? null : cur));
              },
              onClose: (id) => setEditEdge((cur) => (cur === id ? null : cur)),
            }}
          />
          {Object.values(nodes).map((n) => {
            const isCrew = n.type === 'crew';
            return (
              <Card
                key={n.id}
                node={n}
                width={nodeWidth(n.type)}
                height={sizes[n.id] ?? DEFAULT_CARD_H}
                name={isCrew ? ledger.crew.name || n.name : n.name}
                tier={isCrew ? crewTier ?? n.tier : n.tier}
                line={oneLine(n, isCrew ? crewTypeName : undefined)}
                selected={sel === n.id}
                armed={sel === n.id && armed && !dossier}
                focusClock={focusClock}
                showClocks={showClocks}
                h={cardHandlers}
              />
            );
          })}
        </div>
        {radial && <RadialMenu x={radial.x} y={radial.y} items={radialItems} onPick={() => setRadial(null)} />}
        {relatedNode && (
          <RelatedPopover
            x={relatedPos.x}
            y={relatedPos.y}
            name={relatedNode.name}
            rows={relatedRows}
            onPick={(row) => {
              if (row.action !== 'linked') addRelated(latest.current.api, relatedNode, row.item);
            }}
            onClose={() => setRelated(null)}
          />
        )}
      </div>
      {book.open && (
        <BookDialog nodes={ledger.nodes} tab={book.tab} onTab={(tab) => setBook((b) => ({ ...b, tab }))} onPick={addFromBook} onNew={(tab) => addCustom(tab, latest.current.book.at)} onClose={closeBook} />
      )}
      {dossierNode && (
        <Dossier
          node={dossierNode}
          crewTypeName={crewTypeName}
          armed={armed && sel === dossierNode.id}
          onArm={() => {
            setSelId(dossierNode.id);
            setArmed(true);
          }}
          onDelete={() => removeNode(dossierNode.id)}
          onStartLink={() => startLinking(dossierNode.id, { x: dossierNode.x, y: dossierNode.y })}
          onClose={() => {
            setDossier(null);
            setArmed(false);
          }}
        />
      )}
    </>
  );
}
