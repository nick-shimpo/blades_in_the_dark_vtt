/**
 * Small building blocks shared by the character sheet, the crew sheet and the roll dialog:
 * boxes, chips, segmented buttons, commit-on-blur text fields, panels, and the writer hook
 * that always reads the freshest ledger before computing a change (other players may have
 * written in between renders).
 */
import type { ComponentChildren, JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import type { CharacterSheet, CrewSheet, Ledger, Relation } from '../../ledger/types';
import { useLedger } from '../../ui/context';

// ---------------------------------------------------------------- writers

export function useSheetWriters() {
  const api = useLedger();
  const latest = (): Ledger => api.store.current() ?? api.ledger;
  return {
    latest,
    /** Compute a new character sheet from the latest one and write only the changed fields. */
    editChar(id: string, fn: (ch: CharacterSheet, crew: CrewSheet, ledger: Ledger) => CharacterSheet | null | undefined): void {
      const l = latest();
      const ch = l.sheets.chars[id];
      if (!ch) return;
      const next = fn(ch, l.sheets.crew, l);
      if (next && next !== ch) api.saveChar(ch, next);
    },
    /** Same for the crew sheet. */
    editCrew(fn: (crew: CrewSheet, ledger: Ledger) => CrewSheet | null | undefined): void {
      const l = latest();
      const next = fn(l.sheets.crew, l);
      if (next && next !== l.sheets.crew) api.saveCrew(l.sheets.crew, next);
    },
  };
}

/** Toggle a key in a boolean map, dropping it when it turns off (keeps the ledger tidy). */
export function toggleKey(map: Record<string, boolean>, id: string): Record<string, boolean> {
  const out = { ...map };
  if (out[id]) delete out[id];
  else out[id] = true;
  return out;
}

export function setRelation(map: Record<string, Relation>, name: string, rel: Relation): Record<string, Relation> {
  const out = { ...map };
  if (rel) out[name] = rel;
  else delete out[name];
  return out;
}

export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// ---------------------------------------------------------------- box

export interface BoxProps {
  on: boolean;
  size?: number;
  round?: boolean;
  red?: boolean;
  /** Paper on ink, for boxes inside a dark bar. */
  inverse?: boolean;
  /** Dashed faint border and a not-allowed cursor (special armor without the ability). */
  dashed?: boolean;
  title?: string;
  onClick?: () => void;
}

/** One square (or round) tick box. */
export function Box({ on, size = 24, round, red, inverse, dashed, title, onClick }: BoxProps) {
  const cls = ['sh-box', on && 'is-on', round && 'is-round', red && 'is-red', inverse && 'is-inverse', dashed && 'is-dashed'].filter(Boolean).join(' ');
  return <button type="button" class={cls} style={{ width: size, height: size }} title={title} aria-label={title} aria-pressed={on} onClick={onClick} />;
}

// ---------------------------------------------------------------- chip, segmented

export function Chip({ on, title, onClick, children }: { on: boolean; title?: string; onClick: () => void; children: ComponentChildren }) {
  return (
    <button type="button" class={`sh-chip${on ? ' is-on' : ''}`} title={title} aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

export interface SegProps<K extends string> {
  options: readonly (readonly [K, string])[];
  value: K | '' | null;
  onChange: (key: K) => void;
  class?: string;
}

/** Joined buttons; the selected one is ink on paper. */
export function Seg<K extends string>({ options, value, onChange, class: cls }: SegProps<K>) {
  return (
    <div class={`sh-seg${cls ? ` ${cls}` : ''}`}>
      {options.map(([k, label]) => (
        <button type="button" key={k} class={value === k ? 'is-on' : ''} aria-pressed={value === k} onClick={() => onChange(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- text field

export interface FieldProps {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  class?: string;
  style?: JSX.CSSProperties;
  title?: string;
  inputRef?: (el: HTMLInputElement | null) => void;
}

/**
 * A text input that keeps a local draft while focused and commits on blur or Enter (Esc reverts).
 * Remote changes never overwrite what someone is typing; an untouched field follows the ledger.
 */
export function Field({ value, onCommit, placeholder, class: cls, style, title, inputRef }: FieldProps) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  const dirty = useRef(false);
  const revert = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  return (
    <input
      ref={inputRef}
      class={cls}
      style={style}
      value={draft}
      placeholder={placeholder}
      title={title}
      spellcheck={false}
      onFocus={() => {
        focused.current = true;
        dirty.current = false;
      }}
      onInput={(e) => {
        dirty.current = true;
        setDraft((e.currentTarget as HTMLInputElement).value);
      }}
      onBlur={(e) => {
        focused.current = false;
        const v = (e.currentTarget as HTMLInputElement).value;
        if (revert.current) {
          revert.current = false;
          setDraft(value);
        } else if (dirty.current && v !== value) {
          onCommit(v);
        } else {
          setDraft(value);
        }
        dirty.current = false;
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
        else if (e.key === 'Escape') {
          revert.current = true;
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
    />
  );
}

// ---------------------------------------------------------------- panel, bar

export function Panel({ children, rail, class: cls }: { children: ComponentChildren; rail?: boolean; class?: string }) {
  return <div class={`sh-panel${rail ? ' rail' : ''}${cls ? ` ${cls}` : ''}`}>{children}</div>;
}

export function Bar({ children, tone = 'bar', class: cls }: { children: ComponentChildren; tone?: 'bar' | 'dark' | 'ink'; class?: string }) {
  return <div class={`sh-bar ${tone}${cls ? ` ${cls}` : ''}`}>{children}</div>;
}

/** Ability row used by both sheets: 22 px box, bold name, text, italic note, optional veteran tag + remove. */
export function AbilityRow({
  on,
  name,
  text,
  note,
  from,
  onToggle,
  onRemove,
}: {
  on: boolean;
  name: string;
  text: string;
  note?: string;
  from?: string;
  onToggle?: () => void;
  onRemove?: () => void;
}) {
  return (
    <div class={`sh-ability${on ? ' is-on' : ''}`}>
      <Box on={on} size={22} title={name} onClick={onToggle} />
      <div class="sh-ability-body">
        <div class="sh-ability-head">
          <span class="sh-ability-name">{name}</span>
          {from && <span class="sh-ability-from">{from}</span>}
        </div>
        <div class="sh-ability-text">{text}</div>
        {note && <div class="sh-ability-note">{note}</div>}
      </div>
      {onRemove && (
        <button type="button" class="sh-x" title="Remove this veteran ability" onClick={onRemove}>
          ✕
        </button>
      )}
    </div>
  );
}
