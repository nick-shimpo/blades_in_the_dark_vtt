/**
 * References view: a left rail of reference sheets (live miniatures of the rules sheets and
 * thumbnails of static handouts) and the selected one in the main panel. Local state only:
 * the selection (remembered per browser), the image fit toggle and which image files turned
 * out to be missing. Nothing here reads or writes the ledger.
 */
import type { JSX } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { ATTRIBUTION } from '../../data';
import { groupOf, MANIFEST, type RefEntry } from './manifest';
import './references.css';

const LAST_KEY = 'doskvol-table:references:last';

function readLast(): string | null {
  try {
    return localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

function writeLast(id: string): void {
  try {
    localStorage.setItem(LAST_KEY, id);
  } catch {
    // private mode or storage disabled: the selection just isn't remembered
  }
}

/** public/references/<file>, under the deployment base path. */
function assetUrl(file: string): string {
  return `${import.meta.env.BASE_URL}references/${file}`;
}

export function ReferencesView() {
  const firstSheet = MANIFEST[0];
  const [selId, setSelId] = useState<string>(() => {
    const last = readLast();
    return last && MANIFEST.some((e) => e.id === last) ? last : firstSheet.id;
  });
  const [fit, setFit] = useState(true);
  const [missing, setMissing] = useState<Record<string, true>>({});
  const markMissing = useCallback((id: string) => setMissing((m) => (m[id] ? m : { ...m, [id]: true })), []);

  const sel = MANIFEST.find((e) => e.id === selId) ?? firstSheet;
  const select = (id: string) => {
    setSelId(id);
    setFit(true);
    writeLast(id);
  };

  const rules = MANIFEST.filter((e) => groupOf(e) === 'rules');
  const handouts = MANIFEST.filter((e) => groupOf(e) === 'handouts');

  const entry = (e: RefEntry) => {
    const on = e.id === sel.id;
    let thumb: JSX.Element;
    if (e.kind === 'sheet') {
      const Mini = e.component;
      thumb = (
        <span class="rf-mini">
          <Mini />
        </span>
      );
    } else if (missing[e.id]) {
      thumb = <span class="rf-thumb-note">not yet added</span>;
    } else {
      thumb = <img src={assetUrl(e.src)} alt="" onError={() => markMissing(e.id)} />;
    }
    return (
      <button type="button" key={e.id} class={`rf-entry${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => select(e.id)}>
        <span class="rf-thumb" aria-hidden="true">
          {thumb}
        </span>
        <span class="rf-entry-label">{e.label}</span>
      </button>
    );
  };

  let main: JSX.Element;
  if (sel.kind === 'sheet') {
    const Sheet = sel.component;
    main = <Sheet />;
  } else if (missing[sel.id]) {
    main = (
      <p class="rf-missing">
        The file <code>references/{sel.src}</code> has not been added to the repo yet. Drop it into <code>public/references/</code> (see the
        README there) and it will show up here.
      </p>
    );
  } else {
    main = (
      <figure class="rf-figure">
        <img
          class={fit ? 'is-fit' : 'is-natural'}
          src={assetUrl(sel.src)}
          alt={sel.label}
          title={fit ? 'Show at natural size' : 'Fit to the panel'}
          onClick={() => setFit((f) => !f)}
          onError={() => markMissing(sel.id)}
        />
        {sel.credit && <figcaption>{sel.credit}</figcaption>}
      </figure>
    );
  }

  return (
    <div class="refs">
      <aside class="rf-rail">
        {rules.length > 0 && <div class="rf-rail-label">RULES</div>}
        {rules.map(entry)}
        {handouts.length > 0 && <div class="rf-rail-label">MAPS &amp; HANDOUTS</div>}
        {handouts.map(entry)}
        <div class="rf-rail-spacer" />
        <div class="rf-rail-attrib">{ATTRIBUTION}</div>
      </aside>
      <section class="rf-main" key={sel.id}>
        {main}
      </section>
    </div>
  );
}
