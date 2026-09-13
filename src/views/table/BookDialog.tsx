import { useState } from 'preact/hooks';
import type { BookKind } from '../../data';
import type { TableNode } from '../../ledger/types';
import { Dialog } from '../../ui/Dialog';
import { BOOK_TABS, bookChips, bookRows, type BookRow } from './actions';
import { useAutoFocus } from './hooks';

const NEW_LABEL: Record<BookKind, string> = { faction: 'faction', npc: 'NPC', location: 'place', district: 'district' };

export interface BookDialogProps {
  nodes: Record<string, TableNode>;
  tab: BookKind;
  onTab(tab: BookKind): void;
  /** A row was clicked: add it, or centre the card that already carries it. */
  onPick(row: BookRow): void;
  /** "New ... of your own". */
  onNew(tab: BookKind): void;
  onClose(): void;
}

/** From the Book: 780 x <=80vh, tabs, search, filter chips, rows with + ADD / ON TABLE. */
export function BookDialog({ nodes, tab, onTab, onPick, onNew, onClose }: BookDialogProps) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const search = useAutoFocus<HTMLInputElement>(false);
  const chips = bookChips(tab);
  const rows = bookRows(nodes, tab, q, cat);
  return (
    <Dialog onClose={onClose} class="book">
      <div class="book-head">
        <div class="book-title">From the Book</div>
        <div class="book-tabs">
          {BOOK_TABS.map((t) => (
            <button
              key={t.kind}
              type="button"
              class={t.kind === tab ? 'on' : ''}
              onClick={() => {
                onTab(t.kind);
                setCat('');
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input ref={search} class="book-search" value={q} placeholder="search…" onInput={(e) => setQ((e.currentTarget as HTMLInputElement).value)} />
        <button type="button" class="book-close" onClick={onClose} title="Close (esc)">
          ✕
        </button>
      </div>
      {chips.length > 0 && (
        <div class="book-chips">
          {chips.map(([k, label]) => (
            <button key={k} type="button" class={cat === k ? 'on' : ''} onClick={() => setCat(cat === k ? '' : k)}>
              {label}
            </button>
          ))}
        </div>
      )}
      <div class="book-list">
        <button type="button" class="book-new" onClick={() => onNew(tab)}>
          <span class="plus">＋</span>New {NEW_LABEL[tab]} of your own
        </button>
        {rows.map((r) => (
          <button key={r.ref} type="button" class="book-row" onClick={() => onPick(r)}>
            <span class="n">{r.name}</span>
            <span class="c1">{r.c1}</span>
            <span class="c2">{r.c2}</span>
            <span class="c3">{r.c3}</span>
            <span class={`a${r.node ? ' on' : ''}`}>{r.node ? 'ON NETWORK' : '+ ADD'}</span>
          </button>
        ))}
        {rows.length === 0 && <div class="book-empty">Nothing in the book matches.</div>}
      </div>
    </Dialog>
  );
}
