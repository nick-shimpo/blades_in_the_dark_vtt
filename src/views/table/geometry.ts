/**
 * Pure geometry for the Table canvas: ports, edge curves, lanes, fit and zoom.
 * World space is 4000 x 3000; card positions are centres. Nothing here touches the DOM.
 */
import type { Edge, Side } from '../../ledger/types';

export interface Point {
  x: number;
  y: number;
}

/** A card's footprint in world space: centre + size. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** translate(pan) scale(zoom) of the world layer. */
export interface Pan {
  x: number;
  y: number;
  s: number;
}

export const WORLD_W = 4000;
export const WORLD_H = 3000;
export const DEFAULT_CARD_H = 96;
export const LANE_GAP = 16;
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2.5;
export const FIT_MIN = 0.3;
export const FIT_MAX = 1.25;
export const FIT_PAD = 24;

export function sideVec(side: Side): [number, number] {
  return side === 'n' ? [0, -1] : side === 's' ? [0, 1] : side === 'e' ? [1, 0] : [-1, 0];
}

/** Where an edge leaves a card. Lanes shift parallel edges along the side, 16px apart. */
export function portPoint(b: Box, side: Side, lane = 0): Point {
  const hw = b.w / 2;
  const hh = b.h / 2;
  const o = lane * LANE_GAP;
  if (side === 'n') return { x: b.x + o, y: b.y - hh };
  if (side === 's') return { x: b.x + o, y: b.y + hh };
  if (side === 'e') return { x: b.x + hw, y: b.y + o };
  return { x: b.x - hw, y: b.y + o };
}

/** The side of a card that faces a point. */
export function nearestSide(b: Box, px: number, py: number): Side {
  const dx = (px - b.x) / (b.w / 2);
  const dy = (py - b.y) / (b.h / 2);
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n';
}

export function bezierAt(p0: Point, c1: Point, c2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * p3.y,
  };
}

export interface Curve {
  p0: Point;
  c1: Point;
  c2: Point;
  p3: Point;
  mid: Point;
}

/** Cubic bezier from a's side to b's side; control distance clamp(30, 0.4 * dist, 150). */
export function edgeCurve(a: Box, b: Box, fs: Side, ts: Side, lane = 0): Curve {
  const v0 = sideVec(fs);
  const v3 = sideVec(ts);
  const q0 = portPoint(a, fs, lane);
  const q3 = portPoint(b, ts, lane);
  const p0 = { x: q0.x + v0[0] * 5, y: q0.y + v0[1] * 5 };
  const p3 = { x: q3.x + v3[0] * 8, y: q3.y + v3[1] * 8 };
  const dist = Math.hypot(p3.x - p0.x, p3.y - p0.y);
  const k = Math.max(30, Math.min(150, dist * 0.4));
  const c1 = { x: p0.x + v0[0] * k, y: p0.y + v0[1] * k };
  const c2 = { x: p3.x + v3[0] * k, y: p3.y + v3[1] * k };
  return { p0, c1, c2, p3, mid: bezierAt(p0, c1, c2, p3, 0.5) };
}

const r1 = (v: number) => Math.round(v * 10) / 10;

export function curvePath(c: Curve): string {
  return `M${r1(c.p0.x)} ${r1(c.p0.y)} C${r1(c.c1.x)} ${r1(c.c1.y)} ${r1(c.c2.x)} ${r1(c.c2.y)} ${r1(c.p3.x)} ${r1(c.p3.y)}`;
}

export function linePath(a: Point, b: Point): string {
  return `M${r1(a.x)} ${r1(a.y)} L${r1(b.x)} ${r1(b.y)}`;
}

export const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/**
 * Lane index per edge so that parallel edges between the same two cards fan out
 * (0 for a lone edge; -0.5 / +0.5 for two; -1, 0, +1 for three ...). Deterministic across clients.
 */
export function edgeLanes(edges: Edge[]): Map<string, number> {
  const groups = new Map<string, Edge[]>();
  for (const e of edges) {
    const k = pairKey(e.from, e.to);
    const g = groups.get(k);
    if (g) g.push(e);
    else groups.set(k, [e]);
  }
  const lanes = new Map<string, number>();
  for (const g of groups.values()) {
    g.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    g.forEach((e, i) => lanes.set(e.id, i - (g.length - 1) / 2));
  }
  return lanes;
}

export interface EdgeGeometry {
  d: string;
  label: Point;
  fromSide: Side;
  toSide: Side;
}

/** Path + label anchor for one edge. Label sits at the midpoint, pushed out x1.6 for lanes. */
export function edgeGeometry(a: Box, b: Box, e: Edge, lane: number): EdgeGeometry {
  const fs = e.fromSide ?? nearestSide(a, b.x, b.y);
  const ts = e.toSide ?? nearestSide(b, a.x, a.y);
  const cv = edgeCurve(a, b, fs, ts, lane);
  let lx = cv.mid.x;
  let ly = cv.mid.y;
  if (lane) {
    const m0 = edgeCurve(a, b, fs, ts, 0).mid;
    lx += (cv.mid.x - m0.x) * 1.6;
    ly += (cv.mid.y - m0.y) * 1.6;
  }
  return { d: curvePath(cv), label: { x: r1(lx), y: r1(ly) }, fromSide: fs, toSide: ts };
}

// ---------------------------------------------------------------- view transform

export function worldToCanvas(p: Point, pan: Pan): Point {
  return { x: p.x * pan.s + pan.x, y: p.y * pan.s + pan.y };
}

export function canvasToWorld(p: Point, pan: Pan): Point {
  return { x: (p.x - pan.x) / pan.s, y: (p.y - pan.y) / pan.s };
}

/** Zoom by a factor keeping the canvas point (px, py) fixed. */
export function zoomAround(pan: Pan, factor: number, px: number, py: number): Pan {
  const s = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pan.s * factor));
  if (s === pan.s) return pan;
  const w = canvasToWorld({ x: px, y: py }, pan);
  return { x: px - w.x * s, y: py - w.y * s, s };
}

/** Pan so that a world point sits at the centre of a viewport of the given size. */
export function centreOnPoint(p: Point, pan: Pan, vw: number, vh: number): Pan {
  return { x: vw / 2 - p.x * pan.s, y: vh / 2 - p.y * pan.s, s: pan.s };
}

/** FIT: the bounding box of all cards + 24px, scale clamped 0.3 ... 1.25. */
export function fitTransform(boxes: Box[], vw: number, vh: number): Pan {
  if (!boxes.length || vw <= 0 || vh <= 0) return { x: vw / 2 - WORLD_W / 2, y: vh / 2 - WORLD_H / 2, s: 1 };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const b of boxes) {
    const hw = b.w / 2 + FIT_PAD;
    const hh = b.h / 2 + FIT_PAD;
    x0 = Math.min(x0, b.x - hw);
    y0 = Math.min(y0, b.y - hh);
    x1 = Math.max(x1, b.x + hw);
    y1 = Math.max(y1, b.y + hh);
  }
  const s = Math.min(FIT_MAX, Math.max(FIT_MIN, Math.min(vw / (x1 - x0), vh / (y1 - y0))));
  return { x: vw / 2 - ((x0 + x1) / 2) * s, y: vh / 2 - ((y0 + y1) / 2) * s, s };
}

/** Where the RELATED popover (300 x <=380) goes: beside the card, kept inside the canvas. */
export function relatedPopoverPosition(card: Box, pan: Pan, vw: number, vh: number): Point {
  const c = worldToCanvas(card, pan);
  const hw = (card.w / 2) * pan.s;
  const hh = (card.h / 2) * pan.s;
  let rx = c.x + hw + 14;
  if (rx + 300 > vw - 4) rx = c.x - hw - 314;
  if (rx < 4) rx = c.x - 150;
  rx = Math.max(4, Math.min(rx, vw - 304));
  const ry = Math.max(4, Math.min(c.y - hh, vh - 390));
  return { x: Math.round(rx), y: Math.round(ry) };
}
