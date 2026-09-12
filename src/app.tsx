import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { ATTRIBUTION } from './data';
import { newCampaignId } from './ledger/ids';
import { blankLedger, exportLedger, importLedger } from './ledger/normalize';
import type { Ledger, RollRecord } from './ledger/types';
import { createStore, firebaseAvailable, forgetCampaign, recentCampaigns, rememberCampaign, type Store, type StoreStatus } from './sync';
import { LedgerContext, makeLedgerApi, useLedger, VIEWS, type ViewId } from './ui/context';
import { BOOK_EVENT, FIT_EVENT, HINT_EVENT, isTyping, setHint } from './ui/events';
import { RollTicker } from './ui/RollTicker';
import { campaignLink, hrefFor, navigate, useRoute } from './ui/route';
import { PlayView } from './views/play';
import { SheetsView } from './views/sheets';
import { SparksView } from './views/sparks';
import { TableView } from './views/table';

// ---------------------------------------------------------------- root

export function App() {
  const route = useRoute();
  if (!route.campaignId) return <Home />;
  return <Campaign key={route.campaignId} campaignId={route.campaignId} view={route.view} />;
}

// ---------------------------------------------------------------- home

function Home() {
  const [recent, setRecent] = useState(recentCampaigns());
  const [paste, setPaste] = useState(false);

  const create = (ledger: Ledger) => {
    const id = newCampaignId();
    const store = createStore(id);
    store.replace(ledger);
    rememberCampaign(id, ledger.crew.name);
    store.close();
    navigate(id);
  };

  return (
    <div class="home">
      <div class="home-inner">
        <h1>DOSKVOL TABLE</h1>
        <div class="sub">A shared table for one Blades in the Dark campaign. The link is the key: anyone who has it can play.</div>
        <div class="actions">
          <button class="red" onClick={() => create(blankLedger())}>
            NEW CAMPAIGN
          </button>
          <button onClick={() => setPaste(true)}>PASTE A LEDGER…</button>
          <ImportButton onLedger={create} label="IMPORT A COPY…" />
        </div>
        {recent.length > 0 && (
          <>
            <div class="section">RECENT ON THIS BROWSER</div>
            <ul class="recent">
              {recent.map((r) => (
                <li key={r.id}>
                  <a href={hrefFor(r.id)}>{r.name || 'Unnamed Crew'}</a>
                  <span class="when">{new Date(r.at).toLocaleDateString()}</span>
                  <button
                    class="ghost"
                    title="forget this link on this browser"
                    onClick={() => {
                      forgetCampaign(r.id);
                      setRecent(recentCampaigns());
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <div class="mode">{firebaseAvailable() ? 'LIVE · SHARED DATABASE' : 'LOCAL ONLY · THIS BROWSER (no Firebase config)'}</div>
        <div class="attribution">{ATTRIBUTION}</div>
      </div>
      {paste && <PasteDialog onClose={() => setPaste(false)} onLedger={create} />}
    </div>
  );
}

// ---------------------------------------------------------------- campaign

function Campaign({ campaignId, view }: { campaignId: string; view: ViewId }) {
  const store = useMemo<Store>(() => createStore(campaignId), [campaignId]);
  const [ledger, setLedger] = useState<Ledger | null | undefined>(undefined);
  const [status, setStatus] = useState<StoreStatus>({ state: 'connecting', live: false, mode: store.mode });
  const [rolls, setRolls] = useState<RollRecord[]>([]);

  useEffect(() => {
    const a = store.subscribe((l) => setLedger(l));
    const b = store.subscribeStatus(setStatus);
    const c = store.subscribeRolls(setRolls);
    return () => {
      a();
      b();
      c();
      store.close();
    };
  }, [store]);

  useEffect(() => {
    if (ledger) rememberCampaign(campaignId, ledger.crew.name);
  }, [campaignId, ledger?.crew.name]);

  // keys 1–4 switch views when not typing
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const v = VIEWS.find((x) => x.key === e.key);
      if (v) navigate(campaignId, v.id);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [campaignId]);

  if (ledger === undefined) {
    return (
      <div class="placeholder">
        <p>{store.mode === 'firebase' ? 'connecting…' : 'loading…'}</p>
      </div>
    );
  }
  if (ledger === null) {
    return (
      <div class="notfound">
        <h2 style={{ fontFamily: 'var(--font-stencil)', fontSize: 40, margin: 0 }}>NO CAMPAIGN HERE YET</h2>
        <div class="code">{campaignId}</div>
        <p style={{ fontStyle: 'italic', color: 'var(--muted)', maxWidth: 480, textAlign: 'center' }}>
          Nothing has been saved under this link{store.mode === 'local' ? ' on this browser' : ''}. Start a fresh campaign here, or go back and open one you have.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button class="red" onClick={() => store.replace(blankLedger())}>
            START A CAMPAIGN HERE
          </button>
          <button onClick={() => navigate(null)}>BACK</button>
        </div>
      </div>
    );
  }

  const api = makeLedgerApi({
    ledger,
    store,
    status,
    rolls,
    update: (p) => store.update(p),
    replace: (l) => store.replace(l),
    pushRoll: (r) => store.pushRoll(r),
  });

  return (
    <LedgerContext.Provider value={api}>
      <div class="app">
        <Header campaignId={campaignId} view={view} />
        <div class="view">
          {view === 'table' && <TableView />}
          {view === 'sheets' && <SheetsView />}
          {view === 'sparks' && <SparksView />}
          {view === 'play' && <PlayView />}
        </div>
        <RollTicker />
      </div>
    </LedgerContext.Provider>
  );
}

// ---------------------------------------------------------------- header

function Header({ campaignId, view }: { campaignId: string; view: ViewId }) {
  const { ledger, update, status } = useLedger();
  const [hint, setHintState] = useState('');
  const [menu, setMenu] = useState(false);
  const [paste, setPaste] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);

  useEffect(() => {
    const on = (e: Event) => setHintState((e as CustomEvent<string>).detail ?? '');
    window.addEventListener(HINT_EVENT, on);
    return () => window.removeEventListener(HINT_EVENT, on);
  }, []);

  const exportCopy = useCallback(() => {
    const json = JSON.stringify(exportLedger(ledger), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${slug(ledger.crew.name)}.ledger.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setMenu(false);
  }, [ledger]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(campaignLink(campaignId));
      setHint('link copied · send it to your players');
      setTimeout(() => setHint(''), 2500);
    } catch {
      window.prompt('Copy this link', campaignLink(campaignId));
    }
    setMenu(false);
  }, [campaignId]);

  const copyLedger = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportLedger(ledger)));
      setHint('ledger copied to clipboard');
      setTimeout(() => setHint(''), 2500);
    } catch {
      /* ignore */
    }
    setMenu(false);
  }, [ledger]);

  const statusText = statusLabel(status);

  return (
    <header class="hdr">
      <input
        class="hdr-crew"
        value={ledger.crew.name}
        placeholder="Crew name"
        onInput={(e) => update({ 'crew/name': (e.currentTarget as HTMLInputElement).value })}
      />
      <nav class="tabs">
        {VIEWS.map((v) => (
          <button key={v.id} class={v.id === view ? 'active' : ''} onClick={() => navigate(campaignId, v.id)} title={`key ${v.key}`}>
            {v.label}
          </button>
        ))}
      </nav>
      <div class="hdr-hint">{hint}</div>
      <div class="hdr-spacer" />
      {view === 'table' && (
        <>
          <button class="fit" onClick={() => window.dispatchEvent(new CustomEvent(FIT_EVENT))}>
            FIT
          </button>
          <button class="red book" onClick={() => window.dispatchEvent(new CustomEvent(BOOK_EVENT))}>
            ▤ BOOK
          </button>
        </>
      )}
      <div class="menu-wrap">
        <button class={`menu-btn${status.state === 'error' || status.state === 'offline' ? ' alert' : ''}`} onClick={() => setMenu((m) => !m)} aria-label="menu">
          <i />
          <i />
          <i />
        </button>
        {menu && (
          <div class="menu" onMouseLeave={() => setMenu(false)}>
            <div class="menu-head">
              <div class="label">LEDGER</div>
              <div class={`status${status.state === 'error' || status.state === 'offline' ? ' warn' : ''}`}>{statusText}</div>
            </div>
            <button class="row" onClick={copyLink}>
              Copy campaign link
            </button>
            <div class="sep" />
            <button class="row" onClick={exportCopy}>
              Export a copy…
            </button>
            <ImportButton
              asRow
              label="Import a copy…"
              onLedger={(l) => {
                update(replaceAllPatch(l));
                setMenu(false);
              }}
            />
            <button
              class="row"
              onClick={() => {
                setPaste(true);
                setMenu(false);
              }}
            >
              Paste a ledger…
            </button>
            <button class="row" onClick={copyLedger}>
              Copy ledger to clipboard
            </button>
            <div class="sep" />
            <button
              class="row red"
              onClick={() => {
                setConfirmNew(true);
                setMenu(false);
              }}
            >
              New campaign…
            </button>
          </div>
        )}
      </div>
      {paste && (
        <PasteDialog
          onClose={() => setPaste(false)}
          onLedger={(l) => {
            update(replaceAllPatch(l));
          }}
        />
      )}
      {confirmNew && (
        <div class="scrim" onClick={() => setConfirmNew(false)}>
          <div class="dialog" onClick={(e) => e.stopPropagation()}>
            <div class="dlg-head">NEW CAMPAIGN</div>
            <div class="dlg-body">
              <p class="hint">This opens a fresh campaign at a new link. The current one stays where it is; keep its link if you want to come back.</p>
            </div>
            <div class="dlg-foot">
              <button onClick={() => setConfirmNew(false)}>CANCEL</button>
              <button
                class="red"
                onClick={() => {
                  const id = newCampaignId();
                  const s = createStore(id);
                  const l = blankLedger();
                  s.replace(l);
                  rememberCampaign(id, l.crew.name);
                  s.close();
                  setConfirmNew(false);
                  navigate(id);
                }}
              >
                START
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/** A whole-ledger patch (used for import and paste) so that one write replaces every section. */
function replaceAllPatch(l: Ledger): Record<string, unknown> {
  return { crew: l.crew, nodes: l.nodes, edges: l.edges, sheets: l.sheets };
}

function statusLabel(s: StoreStatus): string {
  const t = s.at ? new Date(s.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  switch (s.state) {
    case 'saved':
      return s.mode === 'firebase' ? `SAVED ✓ ${t} · LIVE` : `SAVED ✓ ${t} · THIS BROWSER ONLY`;
    case 'saving':
      return 'SAVING…';
    case 'offline':
      return 'OFFLINE · CHANGES QUEUED';
    case 'connecting':
      return 'CONNECTING…';
    default:
      return 'SAVE FAILED';
  }
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'campaign'
  );
}

// ---------------------------------------------------------------- import / paste

function ImportButton({ onLedger, label, asRow }: { onLedger: (l: Ledger) => void; label: string; asRow?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button class={asRow ? 'row' : ''} onClick={() => ref.current?.click()}>
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={async (e) => {
          const f = (e.currentTarget as HTMLInputElement).files?.[0];
          if (!f) return;
          const l = importLedger(await f.text());
          if (!l) alert('That file is not a ledger.');
          else onLedger(l);
          (e.currentTarget as HTMLInputElement).value = '';
        }}
      />
    </>
  );
}

function PasteDialog({ onClose, onLedger }: { onClose: () => void; onLedger: (l: Ledger) => void }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  return (
    <div class="scrim" onClick={onClose}>
      <div class="dialog" onClick={(e) => e.stopPropagation()}>
        <div class="dlg-head">PASTE A LEDGER</div>
        <div class="dlg-body">
          <p class="hint">Paste the JSON of an exported ledger (from this app or from the prototype).</p>
          <textarea value={text} onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)} autoFocus />
          {err && <p style={{ color: 'var(--red)' }}>{err}</p>}
        </div>
        <div class="dlg-foot">
          <button onClick={onClose}>CANCEL</button>
          <button
            class="red"
            onClick={() => {
              const l = importLedger(text);
              if (!l) setErr('That is not a ledger.');
              else {
                onLedger(l);
                onClose();
              }
            }}
          >
            LOAD
          </button>
        </div>
      </div>
    </div>
  );
}
