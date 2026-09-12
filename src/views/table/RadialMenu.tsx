import { Fragment } from 'preact';

export interface RadialItem {
  glyph: string;
  label: string;
  danger?: boolean;
  act: () => void;
}

const RADIUS = 76;

/** Right-click menu: dashed ring r = 76 around the click point, 48px round buttons, Courier labels outside the ring. */
export function RadialMenu({ x, y, items, onPick }: { x: number; y: number; items: RadialItem[]; onPick: () => void }) {
  return (
    <div
      class="radial"
      style={{ left: x, top: y }}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div class="radial-ring" style={{ left: -RADIUS, top: -RADIUS, width: RADIUS * 2, height: RADIUS * 2 }} />
      <div class="radial-dot" />
      {items.map((it, i) => {
        const a = -Math.PI / 2 + i * ((Math.PI * 2) / items.length);
        const bx = Math.cos(a) * RADIUS;
        const by = Math.sin(a) * RADIUS;
        const lx = Math.cos(a) * (RADIUS + 46);
        const ly = Math.sin(a) * (RADIUS + 46);
        return (
          <Fragment key={it.label}>
            <button
              type="button"
              class={`radial-btn${it.danger ? ' danger' : ''}`}
              title={it.label}
              style={{ left: bx - 24, top: by - 24 }}
              onClick={(e) => {
                e.stopPropagation();
                onPick();
                it.act();
              }}
            >
              <span>{it.glyph}</span>
            </button>
            <div class="radial-label" style={{ left: lx - 46, top: ly - 7 }}>
              {it.label}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
