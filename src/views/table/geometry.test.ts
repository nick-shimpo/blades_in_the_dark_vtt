import { describe, expect, it } from 'vitest';
import type { Edge } from '../../ledger/types';
import * as G from './geometry';

const box = (x: number, y: number, w = 280, h = 100): G.Box => ({ x, y, w, h });

describe('ports and sides', () => {
  it('ports sit at the centre of each side, lanes shift them 16px', () => {
    const b = box(100, 200, 280, 100);
    expect(G.portPoint(b, 'n')).toEqual({ x: 100, y: 150 });
    expect(G.portPoint(b, 's')).toEqual({ x: 100, y: 250 });
    expect(G.portPoint(b, 'e')).toEqual({ x: 240, y: 200 });
    expect(G.portPoint(b, 'w')).toEqual({ x: -40, y: 200 });
    expect(G.portPoint(b, 'n', 1)).toEqual({ x: 116, y: 150 });
    expect(G.portPoint(b, 'e', -0.5)).toEqual({ x: 240, y: 192 });
  });
  it('nearest side faces the other point, normalised by the card size', () => {
    const b = box(0, 0, 280, 100);
    expect(G.nearestSide(b, 500, 0)).toBe('e');
    expect(G.nearestSide(b, -500, 10)).toBe('w');
    expect(G.nearestSide(b, 100, 300)).toBe('s');
    expect(G.nearestSide(b, 100, -300)).toBe('n');
  });
});

describe('edge curves', () => {
  it('control distance is clamped between 30 and 150 (0.4 of the distance)', () => {
    const a = box(0, 0);
    // p0 = 145, p3 = 300 - 148 = 152 -> dist 7 -> clamped up to 30
    const near = G.edgeCurve(a, box(300, 0), 'e', 'w');
    expect(near.c1.x - near.p0.x).toBe(30);
    const mid = G.edgeCurve(a, box(530, 0), 'e', 'w');
    // p0 = 145, p3 = 382 -> dist 237 -> k 94.8
    expect(mid.c1.x - mid.p0.x).toBeCloseTo(94.8, 5);
    const far = G.edgeCurve(a, box(2000, 0), 'e', 'w');
    expect(far.c1.x - far.p0.x).toBe(150);
  });
  it('path is a single cubic from the from-side to the to-side', () => {
    const g = G.edgeGeometry(box(0, 0), box(600, 0), { id: 'e', from: 'a', to: 'b', label: '' }, 0);
    expect(g.fromSide).toBe('e');
    expect(g.toSide).toBe('w');
    // p0 = 140 + 5, p3 = 460 - 8 -> dist 307 -> k = 122.8
    expect(g.d).toBe('M145 0 C267.8 0 329.2 0 452 0');
    expect(g.label).toEqual({ x: 298.5, y: 0 });
  });
  it('explicit sides on the edge win over the nearest side', () => {
    const g = G.edgeGeometry(box(0, 0), box(600, 0), { id: 'e', from: 'a', to: 'b', label: '', fromSide: 'n', toSide: 's' }, 0);
    expect(g.fromSide).toBe('n');
    expect(g.toSide).toBe('s');
  });
  it('lanes fan parallel edges out symmetrically and deterministically', () => {
    const edges: Edge[] = [
      { id: 'e_b', from: 'a', to: 'b', label: '' },
      { id: 'e_a', from: 'b', to: 'a', label: '' },
      { id: 'e_c', from: 'a', to: 'c', label: '' },
    ];
    const lanes = G.edgeLanes(edges);
    expect(lanes.get('e_a')).toBe(-0.5);
    expect(lanes.get('e_b')).toBe(0.5);
    expect(lanes.get('e_c')).toBe(0);
    const three = G.edgeLanes([...edges, { id: 'e_d', from: 'a', to: 'b', label: '' }]);
    expect([three.get('e_a'), three.get('e_b'), three.get('e_d')]).toEqual([-1, 0, 1]);
  });
  it('a lane label sits on its lane (16px) and is pushed out a further x1.6', () => {
    const e: Edge = { id: 'e', from: 'a', to: 'b', label: '' };
    const l0 = G.edgeGeometry(box(0, 0), box(600, 0), e, 0).label;
    const l1 = G.edgeGeometry(box(0, 0), box(600, 0), e, 1).label;
    expect(l1.y - l0.y).toBeCloseTo(16 + 16 * 1.6, 5);
  });
});

describe('view transforms', () => {
  it('zoom keeps the point under the cursor fixed and clamps 0.25 ... 2.5', () => {
    const pan: G.Pan = { x: 100, y: 50, s: 1 };
    const world = G.canvasToWorld({ x: 400, y: 300 }, pan);
    const z = G.zoomAround(pan, 1.5, 400, 300);
    expect(z.s).toBe(1.5);
    expect(G.worldToCanvas(world, z)).toEqual({ x: 400, y: 300 });
    expect(G.zoomAround(pan, 100, 0, 0).s).toBe(2.5);
    expect(G.zoomAround(pan, 0.001, 0, 0).s).toBe(0.25);
  });
  it('fit frames the cards + 24px and clamps the scale 0.3 ... 1.25', () => {
    const one = G.fitTransform([box(2000, 1500, 280, 100)], 1000, 800);
    expect(one.s).toBe(1.25);
    expect(one.x).toBe(500 - 2000 * 1.25);
    expect(one.y).toBe(400 - 1500 * 1.25);
    const wide = G.fitTransform([box(0, 0, 280, 100), box(10000, 0, 280, 100)], 1000, 800);
    expect(wide.s).toBe(0.3);
    const fits = G.fitTransform([box(0, 0, 200, 100), box(1000, 0, 200, 100)], 700, 800);
    // span = 1000 + 200 + 48 = 1248 -> 700 / 1248
    expect(fits.s).toBeCloseTo(700 / 1248, 6);
    const centre = G.worldToCanvas({ x: 500, y: 0 }, fits);
    expect(centre.x).toBeCloseTo(350, 6);
    expect(centre.y).toBeCloseTo(400, 6);
  });
  it('with no cards fit shows the middle of the world at scale 1', () => {
    expect(G.fitTransform([], 1000, 600)).toEqual({ x: 500 - 2000, y: 300 - 1500, s: 1 });
  });
  it('centreOnPoint keeps the zoom', () => {
    expect(G.centreOnPoint({ x: 100, y: 100 }, { x: 0, y: 0, s: 2 }, 800, 600)).toEqual({ x: 200, y: 100, s: 2 });
  });
  it('the RELATED popover sits to the right of the card, or to the left near the edge', () => {
    const pan: G.Pan = { x: 0, y: 0, s: 1 };
    expect(G.relatedPopoverPosition(box(300, 300, 280, 100), pan, 1200, 700)).toEqual({ x: 454, y: 250 });
    expect(G.relatedPopoverPosition(box(1100, 300, 280, 100), pan, 1200, 700)).toEqual({ x: 646, y: 250 });
    expect(G.relatedPopoverPosition(box(300, 690, 280, 100), pan, 1200, 700).y).toBe(310);
  });
});
