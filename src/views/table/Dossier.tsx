import { useCallback, useState } from 'preact/hooks';
import { districtNames, roman } from '../../data';
import { newClock, oneLine, statusInk, statusWord, tickClock } from '../../ledger/rules';
import type { Clock as ClockRec, NodeType, TableNode } from '../../ledger/types';
import { Clock } from '../../ui/Clock';
import { useLedger } from '../../ui/context';
import { Dialog } from '../../ui/Dialog';
import { Markdown } from '../../ui/Markdown';
import { bookEntryOf, readField, SCHEMA, TYPE_TAG, writeField, type SchemaField } from './actions';
import { useAutoFocus } from './hooks';

const TYPE_OPTIONS: [NodeType, string][] = [
  ['crew', 'crew'],
  ['faction', 'faction'],
  ['npc', 'npc'],
  ['location', 'place'],
  ['district', 'district'],
  ['org', 'organisation'],
  ['other', 'other'],
];
const CATEGORY_OPTIONS: [string, string][] = [
  ['', '—'],
  ['underworld', 'underworld'],
  ['institutions', 'institutions'],
  ['labor_and_trade', 'labor & trade'],
  ['fringe', 'the fringe'],
  ['citizenry', 'citizenry'],
];
const OWN_FIELDS: SchemaField[] = [
  { key: 'wants', label: 'WANTS', kind: 'fact' },
  { key: 'details', label: 'DETAILS', kind: 'prose' },
  { key: 'moves', label: 'MOVES', kind: 'prose' },
  { key: 'notes', label: 'NOTES', kind: 'prose' },
];
const isOwn = (key: string) => key === 'wants' || key === 'details' || key === 'moves' || key === 'notes';

export interface DossierProps {
  node: TableNode;
  crewTypeName?: string;
  armed: boolean;
  onArm(): void;
  onDelete(): void;
  onStartLink(): void;
  onClose(): void;
}

/** The dossier modal (design/handoff/README.md, "Dossier"). Every edit is written straight to the ledger. */
export function Dossier({ node, crewTypeName, armed, onArm, onDelete, onStartLink, onClose }: DossierProps) {
  const { ledger, update, saveNode, role } = useLedger();
  const [editKey, setEditKey] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newSize, setNewSize] = useState(6);

  const isCrew = node.type === 'crew';
  const rec = bookEntryOf(node);
  const st = Math.max(-3, Math.min(3, node.status));
  const crewSheet = ledger.sheets.crew;
  const tierFromSheet = isCrew && crewSheet.type ? roman(crewSheet.tier) : null;
  const schema = SCHEMA[node.type] ?? SCHEMA.other;

  const save = (patch: Partial<TableNode>) => saveNode(node, { ...node, ...patch });
  const value = (field: SchemaField) => (isOwn(field.key) ? String((node as unknown as Record<string, unknown>)[field.key] ?? '') : readField(node, field));
  const write = (field: SchemaField, v: string) => (isOwn(field.key) ? save({ [field.key]: v } as Partial<TableNode>) : save({ f: writeField(node, field, v) }));
  const writeClock = (c: ClockRec) => update({ [`nodes/${node.id}/clocks/${c.id}`]: c });
  const stopEditing = (key: string) => setEditKey((cur) => (cur === key ? null : cur));

  // Esc closes the field being edited first, then the dossier.
  const close = useCallback(() => {
    if (editKey) setEditKey(null);
    else onClose();
  }, [editKey, onClose]);

  const facts: SchemaField[] = [...schema.filter((f) => f.kind === 'fact' && (!f.optional || readField(node, f).trim())), OWN_FIELDS[0]];
  const prose: SchemaField[] = schema.filter((f) => f.kind === 'prose');
  if (node.details.trim()) prose.push(OWN_FIELDS[1]);
  if (node.type !== 'location' && node.type !== 'district') prose.push(OWN_FIELDS[2]);
  prose.push(OWN_FIELDS[3]);

  const conns = Object.values(ledger.edges).filter((e) => e.from === node.id || e.to === node.id);
  const clocks = Object.values(node.clocks ?? {});
  const addClock = () => {
    const c = newClock(newName.trim() || 'Clock', newSize);
    writeClock(c);
    setNewName('');
  };
  const source = `${rec ? `FROM THE BOOK${node.page ? ` · p. ${node.page}` : ''}` : 'YOUR OWN ENTRY'} · ${TYPE_TAG[node.type]}`;
  const showTier = isCrew || node.type === 'faction' || node.type === 'org' || node.type === 'other';
  const isFactionLike = node.type === 'faction' || node.type === 'org';

  return (
    <Dialog onClose={close} class="dossier" place="center">
      <aside class="dossier-side">
        <div class="dossier-source">{source}</div>
        <div class="dossier-row">
          <label class="dossier-field" style={{ flex: 1 }}>
            <span class="dossier-lbl">TYPE</span>
            <select value={node.type} onChange={(e) => save({ type: (e.currentTarget as HTMLSelectElement).value as NodeType })}>
              {TYPE_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          {showTier && (
            <label class="dossier-field" style={{ width: 70 }}>
              <span class="dossier-lbl">TIER</span>
              <input
                class="box tier"
                value={tierFromSheet ?? node.tier}
                placeholder="II"
                disabled={tierFromSheet != null}
                title={tierFromSheet != null ? 'Set on the crew sheet' : 'Tier (0, I … VI)'}
                onInput={(e) => save({ tier: (e.currentTarget as HTMLInputElement).value.toUpperCase() })}
              />
            </label>
          )}
        </div>
        <label class="dossier-field">
          <span class="dossier-lbl">DISTRICT / TERRITORY</span>
          <input class="box" value={node.district} list="doskvol-districts" onInput={(e) => save({ district: (e.currentTarget as HTMLInputElement).value })} />
          <datalist id="doskvol-districts">
            {districtNames.map((d) => (
              <option key={d} value={d} />
            ))}
            <option value="Citywide" />
          </datalist>
        </label>
        {isFactionLike && (
          <div class="dossier-row">
            <div class="dossier-field" style={{ flex: 1 }}>
              <span class="dossier-lbl">HOLD</span>
              <div class="seg">
                {(['strong', 'weak'] as const).map((hv) => (
                  <button
                    key={hv}
                    type="button"
                    class={node.f.hold === hv ? 'on' : ''}
                    onClick={() => save({ f: { ...node.f, hold: node.f.hold === hv ? '' : hv } })}
                  >
                    {hv.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <label class="dossier-field" style={{ flex: 1.3 }}>
              <span class="dossier-lbl">CATEGORY</span>
              <select value={node.f.category ?? ''} onChange={(e) => save({ f: { ...node.f, category: (e.currentTarget as HTMLSelectElement).value } })}>
                {CATEGORY_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {!isCrew && (
          <div class="dossier-field" style={{ gap: 4 }}>
            <span class="dossier-lbl">STATUS WITH THE CREW</span>
            <div class="seg status">
              {[-3, -2, -1, 0, 1, 2, 3].map((v) => (
                <button
                  key={v}
                  type="button"
                  class={st === v ? 'on' : ''}
                  title={statusWord(v)}
                  style={st === v ? { background: statusInk(v), borderColor: 'var(--ink)' } : undefined}
                  onClick={() => save({ status: v })}
                >
                  {v > 0 ? `+${v}` : String(v)}
                </button>
              ))}
            </div>
            <div class="dossier-status-word" style={{ color: st === 0 ? 'var(--muted)' : statusInk(st) }}>
              {`${st > 0 ? '+' : st < 0 ? '−' : ''}${Math.abs(st)} · ${statusWord(st)}`}
            </div>
          </div>
        )}
        <div class="dossier-sec" style={role === 'gm' ? undefined : { display: 'none' }}>
          <div class="dossier-sec-title">CLOCKS</div>
          {clocks.map((c) => (
            <div key={c.id} class="dossier-clock">
              <Clock size={c.size} filled={c.filled} diameter={36} title="click: tick · right-click: untick" onTick={(d) => writeClock(tickClock(c, d))} />
              <div class="body">
                <input class="name" value={c.name} onInput={(e) => writeClock({ ...c, name: (e.currentTarget as HTMLInputElement).value })} />
                <div class="ctl">
                  <span class="count">
                    {c.filled} / {c.size}
                  </span>
                  <select
                    value={String(c.size)}
                    title="Segments"
                    onChange={(e) => {
                      const size = parseInt((e.currentTarget as HTMLSelectElement).value, 10) || 6;
                      writeClock({ ...c, size, filled: Math.min(c.filled, size) });
                    }}
                  >
                    {[4, 6, 8, 10, 12].map((s) => (
                      <option key={s} value={String(s)}>
                        {s} segments
                      </option>
                    ))}
                  </select>
                  <span style={{ flex: 1 }} />
                  <button type="button" class="reset" title="Reset to empty" onClick={() => writeClock({ ...c, filled: 0 })}>
                    RESET
                  </button>
                  <button type="button" class="dossier-x" title="Remove clock" onClick={() => update({ [`nodes/${node.id}/clocks/${c.id}`]: null })}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div class="dossier-newclock">
            <input
              value={newName}
              placeholder="new clock…"
              onInput={(e) => setNewName((e.currentTarget as HTMLInputElement).value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addClock();
              }}
            />
            <select value={String(newSize)} onChange={(e) => setNewSize(parseInt((e.currentTarget as HTMLSelectElement).value, 10) || 6)}>
              {[4, 6, 8, 10, 12].map((s) => (
                <option key={s} value={String(s)}>
                  {s}
                </option>
              ))}
            </select>
            <button type="button" onClick={addClock}>
              ADD
            </button>
          </div>
        </div>
        <div class="dossier-sec" style={{ display: 'flex', flexDirection: 'column' }}>
          <div class="dossier-sec-title">CONNECTIONS</div>
          {conns.map((e) => {
            const out = e.from === node.id;
            const other = ledger.nodes[out ? e.to : e.from];
            return (
              <div key={e.id} class="dossier-conn">
                <span class="g">{out ? '→' : '←'}</span>
                <div class="body">
                  <span class="other">{other?.name ?? '?'}</span>
                  <span class="lbl">{(e.label || '…').toUpperCase()}</span>
                </div>
                <button type="button" class="dossier-x" title="Remove connection" onClick={() => update({ [`edges/${e.id}`]: null })}>
                  ✕
                </button>
              </div>
            );
          })}
          {conns.length === 0 && <div class="dossier-none">Nothing drawn yet.</div>}
          <button type="button" class="dossier-link" onClick={onStartLink}>
            ⤝ CONNECT TO…
          </button>
        </div>
        <button type="button" class={`dossier-remove${armed ? ' armed' : ''}`} onClick={() => (armed ? onDelete() : onArm())}>
          {armed ? '✕ CONFIRM — REMOVE FROM THE TABLE' : '✕ REMOVE FROM THE TABLE'}
        </button>
      </aside>
      <section class="dossier-main">
        <div class="dossier-title">
          <div class="fields">
            <input
              class="dossier-name"
              value={isCrew ? ledger.crew.name : node.name}
              title="Name — click to edit"
              onInput={(e) => {
                const v = (e.currentTarget as HTMLInputElement).value;
                if (isCrew) update({ 'crew/name': v, [`nodes/${node.id}/name`]: v });
                else save({ name: v });
              }}
            />
            <input
              class="dossier-blurb"
              value={node.blurb}
              placeholder={oneLine({ ...node, blurb: '' }, crewTypeName) || 'one line for the table…'}
              title="The one line shown on the table. Leave empty to use the book's."
              onInput={(e) => save({ blurb: (e.currentTarget as HTMLInputElement).value })}
            />
          </div>
          <button type="button" class="dossier-close" title="Close (esc)" onClick={onClose}>
            ✕
          </button>
        </div>
        {facts.length > 0 && (
          <div class="dossier-facts">
            {facts.map((f) => {
              const v = value(f);
              return (
                <FactRow key={f.key} field={f} value={v} editing={editKey === f.key} onStart={() => setEditKey(f.key)} onStop={() => stopEditing(f.key)} onInput={(t) => write(f, t)} />
              );
            })}
          </div>
        )}
        {prose.map((f) => {
          const v = value(f);
          return (
            <ProseSection key={f.key} field={f} value={v} editing={editKey === f.key} onStart={() => setEditKey(f.key)} onStop={() => stopEditing(f.key)} onInput={(t) => write(f, t)} />
          );
        })}
      </section>
    </Dialog>
  );
}

interface FieldEditorProps {
  field: SchemaField;
  value: string;
  editing: boolean;
  onStart(): void;
  onStop(): void;
  onInput(v: string): void;
}

function FactRow({ field, value, editing, onStart, onStop, onInput }: FieldEditorProps) {
  return (
    <>
      <div class="k">{field.label}</div>
      <div class="v">
        {editing ? (
          <FactInput value={value} onInput={onInput} onStop={onStop} />
        ) : (
          <div class={`dossier-fact-text${value.trim() ? '' : ' empty'}`} title="Click to edit" onClick={onStart}>
            {value.trim() ? value : '—'}
          </div>
        )}
      </div>
    </>
  );
}

function FactInput({ value, onInput, onStop }: { value: string; onInput: (v: string) => void; onStop: () => void }) {
  const ref = useAutoFocus<HTMLInputElement>(false);
  return (
    <input
      ref={ref}
      class="dossier-fact-edit"
      value={value}
      spellcheck={false}
      onInput={(e) => onInput((e.currentTarget as HTMLInputElement).value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
      }}
      onBlur={onStop}
    />
  );
}

function ProseSection({ field, value, editing, onStart, onStop, onInput }: FieldEditorProps) {
  return (
    <div>
      <div class="dossier-prose-title">{field.label}</div>
      {editing ? (
        <ProseInput value={value} onInput={onInput} onStop={onStop} />
      ) : (
        <div class={`dossier-prose-text${value.trim() ? '' : ' empty'}`} title="Click to edit" onClick={onStart}>
          {value.trim() ? <Markdown text={value} /> : '— click to write —'}
        </div>
      )}
    </div>
  );
}

function ProseInput({ value, onInput, onStop }: { value: string; onInput: (v: string) => void; onStop: () => void }) {
  const ref = useAutoFocus<HTMLTextAreaElement>(false);
  const rows = Math.max(4, Math.min(16, value.split('\n').length + 2));
  return (
    <textarea
      ref={ref}
      class="dossier-prose-edit"
      rows={rows}
      value={value}
      spellcheck={false}
      placeholder="markdown works — **bold**, *italic*, - lists"
      onInput={(e) => onInput((e.currentTarget as HTMLTextAreaElement).value)}
      onBlur={onStop}
    />
  );
}
