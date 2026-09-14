import { useEffect, useState } from 'preact/hooks';

/**
 * Compact layout for phones and tablets. Decided by viewport width (≤ 1024 px) unless the
 * viewer has forced a layout from the ☰ menu. In compact mode the app shows only Sheets,
 * References and Dice; the canvases (Play, Network) and the GM tools need a desktop.
 */
export type LayoutPref = 'auto' | 'compact' | 'full';
const PREF_KEY = 'doskvol-table:layout';
export const COMPACT_QUERY = '(max-width: 1024px)';

export function readLayoutPref(): LayoutPref {
  try {
    const v = localStorage.getItem(PREF_KEY);
    return v === 'compact' || v === 'full' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

export function writeLayoutPref(pref: LayoutPref): void {
  try {
    if (pref === 'auto') localStorage.removeItem(PREF_KEY);
    else localStorage.setItem(PREF_KEY, pref);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(LAYOUT_EVENT));
}

export const LAYOUT_EVENT = 'doskvol:layout';

function matches(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(COMPACT_QUERY).matches : false;
}

export function isCompact(pref: LayoutPref = readLayoutPref()): boolean {
  if (pref === 'compact') return true;
  if (pref === 'full') return false;
  return matches();
}

/** True while the compact layout applies; re-evaluates on resize and when the preference changes. */
export function useCompact(): { compact: boolean; pref: LayoutPref } {
  const [state, setState] = useState(() => ({ pref: readLayoutPref(), compact: isCompact() }));
  useEffect(() => {
    const update = () => setState({ pref: readLayoutPref(), compact: isCompact() });
    const mq = typeof window.matchMedia === 'function' ? window.matchMedia(COMPACT_QUERY) : null;
    mq?.addEventListener?.('change', update);
    window.addEventListener(LAYOUT_EVENT, update);
    return () => {
      mq?.removeEventListener?.('change', update);
      window.removeEventListener(LAYOUT_EVENT, update);
    };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('compact', state.compact);
    return () => document.documentElement.classList.remove('compact');
  }, [state.compact]);
  return state;
}
