import { useEffect, useRef } from 'preact/hooks';

/** Focus (and select the text of) an input as soon as it mounts. */
export function useAutoFocus<T extends HTMLInputElement | HTMLTextAreaElement>(select = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    if (select) el.select();
  }, []);
  return ref;
}

/** Report an element's layout height whenever it changes (ResizeObserver; falls back to one measurement). */
export function useMeasuredHeight<T extends HTMLElement>(id: string, onHeight: (id: string, h: number) => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onHeight);
  cb.current = onHeight;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => cb.current(id, el.offsetHeight);
    report();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [id]);
  return ref;
}

/** True while the pointer event target is inside an interactive control (so it should not start a drag). */
export function inControl(target: EventTarget | null, extra = ''): boolean {
  const t = target as HTMLElement | null;
  return !!t?.closest?.('button,input,select,textarea' + (extra ? ',' + extra : ''));
}
