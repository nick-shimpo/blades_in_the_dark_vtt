import { GLYPH, type RelatedItem } from './actions';

export type RelatedAction = 'add' | 'link' | 'linked';

export interface RelatedRow {
  item: RelatedItem;
  action: RelatedAction;
}

const ACTION_TEXT: Record<RelatedAction, string> = { add: '+ ADD', link: '⤝ LINK', linked: '✓ LINKED' };

/** RELATED popover beside a card: everything the book links to it, with + ADD / LINK / LINKED. */
export function RelatedPopover({ x, y, name, rows, onPick, onClose }: { x: number; y: number; name: string; rows: RelatedRow[]; onPick: (row: RelatedRow) => void; onClose: () => void }) {
  return (
    <div
      class="related"
      style={{ left: x, top: y }}
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div class="related-head">
        <span class="related-tag">RELATED</span>
        <span class="related-name">{name}</span>
        <button type="button" class="related-close" onClick={onClose} title="Close (esc)">
          ✕
        </button>
      </div>
      <div class="related-list">
        {rows.map((r) => (
          <button
            key={`${r.item.kind}:${r.item.ref}`}
            type="button"
            class="related-row"
            onClick={(e) => {
              e.stopPropagation();
              onPick(r);
            }}
          >
            <span class="g">{GLYPH[r.item.kind]}</span>
            <span class="t">
              <span class="n">{r.item.name}</span> <span class="s">{r.item.sub}</span>
            </span>
            <span class={`a${r.action === 'linked' ? ' done' : ''}`}>{ACTION_TEXT[r.action]}</span>
          </button>
        ))}
        {rows.length === 0 && <div class="related-empty">The book links nothing else to this entry.</div>}
      </div>
    </div>
  );
}
