import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';

export interface DialogProps {
  title?: ComponentChildren;
  onClose: () => void;
  children: ComponentChildren;
  footer?: ComponentChildren;
  width?: number | string;
  /** Extra class on the dialog box (e.g. 'dossier'). */
  class?: string;
  /** Vertical placement: 'top' (default, 8vh) or 'center'. */
  place?: 'top' | 'center';
}

/** Scrim + box. Esc and a click on the scrim close it. */
export function Dialog({ title, onClose, children, footer, width, class: cls, place = 'top' }: DialogProps) {
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', on, true);
    return () => window.removeEventListener('keydown', on, true);
  }, [onClose]);
  return (
    <div class="scrim" style={place === 'center' ? { alignItems: 'center', paddingTop: 0 } : undefined} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div class={`dialog${cls ? ` ${cls}` : ''}`} style={width ? { width } : undefined} role="dialog" aria-modal="true">
        {title != null && <div class="dlg-head">{title}</div>}
        <div class="dlg-body">{children}</div>
        {footer && <div class="dlg-foot">{footer}</div>}
      </div>
    </div>
  );
}
