import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * True while the pointer event target is inside an interactive control, so a drag must not start
 * from it. The clock dial carries `data-grab`: it is a real button (click ticks), but dragging it
 * moves the clock, so it is exempt.
 */
export function inSceneControl(target: EventTarget | null): boolean {
  const t = target as HTMLElement | null;
  const c = t?.closest?.('button,input,select,textarea');
  return !!c && !c.hasAttribute('data-grab');
}

export interface DraftField {
  value: string;
  onInput(e: Event): void;
  onKeyDown(e: KeyboardEvent): void;
  onBlur(): void;
}

export interface DraftOptions {
  /** Enter inserts a newline instead of committing (card body). */
  multiline?: boolean;
  /** Applied to every keystroke (the clock name turns newlines into spaces). */
  clean?: (v: string) => string;
}

/**
 * A shared text field that never fights the other players: it shows the ledger value until the
 * user types, then keeps a local draft so a remote write cannot clobber the typing. The draft is
 * committed on blur (Enter blurs unless `multiline`) and when the field unmounts mid-edit;
 * Escape throws it away and blurs.
 */
export function useDraft(value: string, commit: (v: string) => void, opts: DraftOptions = {}): DraftField {
  const [draft, setDraft] = useState<string | null>(null);
  const draftRef = useRef<string | null>(null);
  const cancel = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;
  const commitRef = useRef(commit);
  commitRef.current = commit;

  const set = (v: string | null) => {
    draftRef.current = v;
    setDraft(v);
  };

  // A field that disappears while a draft is pending (the clock name editor closing) still lands its text.
  useEffect(
    () => () => {
      const d = draftRef.current;
      if (d !== null && !cancel.current && d !== valueRef.current) commitRef.current(d);
    },
    [],
  );

  return {
    value: draft ?? value,
    onInput(e) {
      const raw = (e.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
      set(opts.clean ? opts.clean(raw) : raw);
    },
    onKeyDown(e) {
      if (e.key === 'Escape') {
        cancel.current = true;
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      } else if (e.key === 'Enter' && !opts.multiline) {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
    },
    onBlur() {
      const d = draftRef.current;
      if (!cancel.current && d !== null && d !== valueRef.current) commitRef.current(d);
      cancel.current = false;
      set(null);
    },
  };
}
