import { useEffect } from 'preact/hooks';

/** Views publish a transient red header hint and react to the header's FIT / BOOK buttons through window events. */
export const HINT_EVENT = 'doskvol:hint';
export const FIT_EVENT = 'doskvol:fit';
export const BOOK_EVENT = 'doskvol:book';
/** Header SWEEP button pressed (Scene view). The Scene owns the two-step arming and clears on the second press. */
export const SWEEP_EVENT = 'doskvol:sweep';
/** Scene → header: `detail` is true while the sweep is armed, so the button can take the red treatment. */
export const SWEEP_STATE_EVENT = 'doskvol:sweep-state';

export function setHint(text: string): void {
  window.dispatchEvent(new CustomEvent(HINT_EVENT, { detail: text }));
}

/** Show a hint for a few seconds. */
export function flashHint(text: string, ms = 2500): void {
  setHint(text);
  window.setTimeout(() => setHint(''), ms);
}

export function useWindowEvent<T = unknown>(name: string, handler: (detail: T, ev: Event) => void, deps: unknown[] = []): void {
  useEffect(() => {
    const on = (e: Event) => handler((e as CustomEvent<T>).detail, e);
    window.addEventListener(name, on);
    return () => window.removeEventListener(name, on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** True when the keyboard focus is in a text field, so global shortcuts should stay quiet. */
export function isTyping(target: EventTarget | null): boolean {
  const t = target as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}
