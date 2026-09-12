import type { Edge } from '../../ledger/types';
import type { EdgeTone } from '../../ledger/rules';
import { WORLD_H, WORLD_W, type Point } from './geometry';
import { useAutoFocus } from './hooks';

export interface EdgeView {
  edge: Edge;
  d: string;
  label: Point;
  tone: EdgeTone;
  editing: boolean;
}

const STROKE: Record<EdgeTone, string> = { ink: 'rgba(34,28,19,0.75)', red: 'var(--red)', green: 'var(--edge-green)' };

/** The SVG beneath the cards: every edge (with a 16px transparent hit stroke), plus the dashed line while drawing or linking. */
export function EdgeSvg({ edges, dragPath, linkPath, onEdgeClick }: { edges: EdgeView[]; dragPath?: string; linkPath?: string; onEdgeClick: (id: string) => void }) {
  return (
    <svg class="tbl-svg" width={WORLD_W} height={WORLD_H}>
      <defs>
        <marker id="arr-ink" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="rgba(34,28,19,0.85)" />
        </marker>
        <marker id="arr-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#8c2f1b" />
        </marker>
        <marker id="arr-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="#3f6a45" />
        </marker>
      </defs>
      {edges.map((v) => (
        <g key={v.edge.id}>
          <path
            class="hit"
            d={v.d}
            fill="none"
            stroke="transparent"
            stroke-width={16}
            onClick={(e) => {
              e.stopPropagation();
              onEdgeClick(v.edge.id);
            }}
          />
          <path d={v.d} fill="none" stroke={v.editing ? 'var(--red)' : STROKE[v.tone]} stroke-width={v.editing ? 2.4 : 1.8} marker-end={`url(#arr-${v.editing ? 'red' : v.tone})`} />
        </g>
      ))}
      {dragPath && <path d={dragPath} fill="none" stroke="var(--red)" stroke-width={1.8} stroke-dasharray="5 4" marker-end="url(#arr-red)" />}
      {linkPath && <path d={linkPath} fill="none" stroke="var(--red)" stroke-width={1.8} stroke-dasharray="5 4" marker-end="url(#arr-red)" />}
    </svg>
  );
}

export interface EdgeLabelHandlers {
  onEdit(id: string): void;
  onLabel(id: string, label: string): void;
  onDelete(id: string): void;
  onClose(id: string): void;
}

/** Label pills at the midpoints (DOM, in the world layer so they zoom with the cards). */
export function EdgeLabels({ edges, h }: { edges: EdgeView[]; h: EdgeLabelHandlers }) {
  return (
    <>
      {edges.map((v) => (
        <div key={v.edge.id} class={`edge-label${v.editing ? ' editing' : ''}`} style={{ left: v.label.x, top: v.label.y }}>
          {v.editing ? (
            <LabelEditor view={v} h={h} />
          ) : (
            <button
              type="button"
              class={`edge-pill${v.edge.label.trim() ? '' : ' empty'}${v.edge.label.trim() ? ` ${v.tone}` : ''}`}
              title="Click to edit the label"
              onClick={(e) => {
                e.stopPropagation();
                h.onEdit(v.edge.id);
              }}
            >
              {v.edge.label.trim() || 'label'}
            </button>
          )}
        </div>
      ))}
    </>
  );
}

function LabelEditor({ view: v, h }: { view: EdgeView; h: EdgeLabelHandlers }) {
  const ref = useAutoFocus<HTMLInputElement>();
  const width = Math.max(110, Math.min(260, v.edge.label.length * 8.5 + 26));
  return (
    <div
      class="edge-edit"
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <input
        ref={ref}
        value={v.edge.label}
        placeholder="relationship…"
        spellcheck={false}
        style={{ width }}
        onInput={(e) => h.onLabel(v.edge.id, (e.currentTarget as HTMLInputElement).value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') (e.currentTarget as HTMLInputElement).blur();
        }}
        onBlur={() => h.onClose(v.edge.id)}
      />
      <button
        type="button"
        title="Remove connection"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          h.onDelete(v.edge.id);
        }}
      >
        ✕
      </button>
    </div>
  );
}
