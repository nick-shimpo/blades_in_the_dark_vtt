/**
 * Building blocks for the built reference sheets: the sheet frame (title band, panel grid,
 * page footer) and the panel vocabulary borrowed from the Sheets view (bars, dotted rows,
 * tables, numbered steps). Pure layout; every sheet passes its own rules text in.
 */
import type { ComponentChildren } from 'preact';

export function RefSheet({ title, sub, pages, children }: { title: string; sub: string; pages?: string; children: ComponentChildren }) {
  return (
    <article class="rf-sheet">
      <header class="rf-band">
        <h2>{title}</h2>
        <p class="rf-sub">{sub}</p>
      </header>
      <div class="rf-grid">{children}</div>
      {pages && <footer class="rf-foot">core rulebook {pages}</footer>}
    </article>
  );
}

export function Panel({ title, note, wide, children }: { title: string; note?: string; wide?: boolean; children: ComponentChildren }) {
  return (
    <section class={`rf-panel${wide ? ' wide' : ''}`}>
      <div class="rf-bar">
        <span>{title}</span>
        {note && <span class="rf-bar-note">{note}</span>}
      </div>
      <div class="rf-body">{children}</div>
    </section>
  );
}

/** Small mono label above a block. */
export function Label({ children }: { children: ComponentChildren }) {
  return <div class="rf-label">{children}</div>;
}

/** Muted italic aside under a block. */
export function Note({ children }: { children: ComponentChildren }) {
  return <p class="rf-note">{children}</p>;
}

export type Row = [ComponentChildren, ComponentChildren];

/** Two-column key / text rows with dotted dividers. */
export function Rows({ rows }: { rows: Row[] }) {
  return (
    <div class="rf-rows">
      {rows.map(([k, t], i) => (
        <div class="rf-row" key={i}>
          <div class="rf-row-k">{k}</div>
          <div class="rf-row-t">{t}</div>
        </div>
      ))}
    </div>
  );
}

export function Table({ head, rows, keyCol = true }: { head: ComponentChildren[]; rows: ComponentChildren[][]; keyCol?: boolean }) {
  return (
    <div class="rf-table-wrap">
      <table class="rf-table">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} class={keyCol && j === 0 ? 'k' : undefined}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Steps({ items }: { items: ComponentChildren[] }) {
  return (
    <ol class="rf-steps">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ol>
  );
}

export function List({ items }: { items: ComponentChildren[] }) {
  return (
    <ul class="rf-list">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
