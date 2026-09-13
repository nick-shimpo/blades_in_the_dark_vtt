/**
 * Sparks — GM random tables. A port of the prototype's `showSparks` block: three engines
 * (score seed, score, NPC), the table-group chip row, the faction finder (rows add to the
 * Table), per-playbook prompt tables, the Doskvol name generator, and the group's tables.
 * Everything rolled here is local UI state; only "+ TABLE" writes to the ledger.
 */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { bookIndex, roman, sparks, type Faction } from '../../data';
import { useLedger } from '../../ui/context';
import { flashHint } from '../../ui/events';
import { addBookNode, centreOn, nodeByRef } from '../table/actions';
import {
  FACTION_CATS,
  GROUPS,
  NPC_IDS,
  PLAYBOOK_NAMES,
  SCORE_IDS,
  SPARK_IDS,
  catShort,
  districtSub,
  filteredFactions,
  finderFactions,
  genNameStr,
  pbItems,
  pbKey,
  rnd,
  rollIndex,
  rollResult,
  rolledLabel,
  sparkLine,
  tableById,
  tablesForGroup,
  type GroupId,
  type NameKind,
  type Rolls,
} from './engine';
import './sparks.css';

interface EngineRow {
  k: string;
  v: string;
  re: () => void;
}

export function SparksView() {
  const api = useLedger();
  const [group, setGroup] = useState<GroupId>('generic');
  const [playbook, setPlaybook] = useState<string>(PLAYBOOK_NAMES.includes('Cutter') ? 'Cutter' : PLAYBOOK_NAMES[0] ?? '');
  const [rolls, setRolls] = useState<Rolls>({});
  const [names, setNames] = useState<string[]>([]);
  const [flashAdd, setFlashAdd] = useState<string | null>(null);
  const [factionQ, setFactionQ] = useState('');
  const [factionCats, setFactionCats] = useState<string[]>([]);
  const [factionPick, setFactionPick] = useState<string | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  // ---- rolling

  const roll = (id: string) => {
    const t = tableById.get(id);
    if (!t) return;
    setRolls((r) => ({ ...r, [id]: rollIndex(t.items, r[id]) }));
  };
  const rollMany = (ids: readonly string[]) =>
    setRolls((r) => {
      const next = { ...r };
      for (const id of ids) {
        const t = tableById.get(id);
        if (t) next[id] = rnd(t.items);
      }
      return next;
    });
  const rollPb = (cat: string) => {
    const key = pbKey(playbook, cat);
    const arr = pbItems(playbook, cat);
    if (!arr.length) return;
    setRolls((r) => ({ ...r, [key]: rollIndex(arr, r[key]) }));
  };
  const rollPbAll = () =>
    setRolls((r) => {
      const next = { ...r };
      for (const [k] of sparks.playbookPromptCategories) {
        const arr = pbItems(playbook, k);
        if (arr.length) next[pbKey(playbook, k)] = rnd(arr);
      }
      return next;
    });
  const pushName = (kind: NameKind) => {
    const n = genNameStr(kind);
    setNames((ns) => [n, ...ns].slice(0, 4));
  };
  const rollSpark = () => rollMany(SPARK_IDS);
  const rollScore = () => rollMany(SCORE_IDS);
  const rollNpc = () => {
    pushName(Math.random() < 0.3 ? 'full' : 'name');
    rollMany(NPC_IDS);
  };

  // ---- faction finder → Table

  const flash = (id: string) => {
    window.clearTimeout(flashTimer.current);
    setFlashAdd(id);
    flashTimer.current = window.setTimeout(() => setFlashAdd(null), 1200);
  };
  const isOnTable = (ref: string) => !!nodeByRef(api, ref);
  const addFaction = (f: Faction) => {
    const existing = nodeByRef(api, f.id);
    if (existing) {
      centreOn(existing.id);
      flash(f.id);
      flashHint(`${f.name} is already on the table`);
      return;
    }
    const node = addBookNode(api, 'faction', f.id);
    flash(f.id);
    if (node) flashHint(`${f.name} added to the table`);
  };
  const toggleCat = (c: string) => setFactionCats((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  const setQuery = (q: string) => {
    setFactionQ(q);
    setFactionPick(null);
  };

  // ---- view models

  const engineRow = (k: string, id: string): EngineRow => ({ k, v: rollResult(rolls, id) ?? '—', re: () => roll(id) });
  const sparkRows: EngineRow[] = [engineRow('DESCRIPTOR', 'descriptor'), engineRow('ACTION', 'action'), engineRow('OBJECT', 'object'), engineRow('MOTIVE', 'motive'), engineRow('TWIST', 'twist')];
  const scoreRows: EngineRow[] = [engineRow('TYPE', 'scoretype'), engineRow('TARGET', 'target'), engineRow('WHY NOW', 'whynow'), engineRow('WHY CARE', 'whycare')];
  const npcRows: EngineRow[] = [
    { k: 'NAME', v: names[0] ?? '—', re: () => pushName(Math.random() < 0.3 ? 'full' : 'name') },
    engineRow('ROLE', 'npcrole'),
    engineRow('WANTS', 'npcwant'),
    engineRow('PROBLEM', 'npcproblem'),
    engineRow('TELL', 'tell'),
  ];
  const tables = tablesForGroup(group);

  return (
    <main class="sparks">
      <div class="sparks-inner">
        <div class="sparks-engines">
          <EngineCard dark title="Roll Spark" rows={sparkRows} onRoll={rollSpark} foot={<div class="spark-line">{sparkLine(rolls)}</div>} />
          <EngineCard title="Score" rows={scoreRows} onRoll={rollScore} foot={<div class="score-note">why care is the table that matters</div>} />
          <EngineCard title="NPC" rows={npcRows} onRoll={rollNpc} />
        </div>

        <div class="group-bar">
          {GROUPS.map((g) => (
            <button key={g.id} class={`chip${group === g.id ? ' on' : ''}`} onClick={() => setGroup(g.id)}>
              {g.label}
            </button>
          ))}
          <div class="spacer" />
          <span class="tip">click ROLL · ⟳ rerolls</span>
        </div>

        {group === 'factions' && (
          <FactionFinder q={factionQ} setQ={setQuery} cats={factionCats} toggleCat={toggleCat} pick={factionPick} setPick={setFactionPick} flashAdd={flashAdd} isOnTable={isOnTable} onAdd={addFaction} />
        )}

        {group === 'playbooks' && <PlaybookPrompts playbook={playbook} setPlaybook={setPlaybook} rolls={rolls} rollPb={rollPb} rollPbAll={rollPbAll} />}

        {group === 'npc' && (
          <div class="panel namegen">
            <div class="namegen-title">Doskvol Names</div>
            <button class="name-btn" onClick={() => pushName('name')}>
              NAME
            </button>
            <button class="name-btn" onClick={() => pushName('alias')}>
              ALIAS
            </button>
            <button class="name-btn" onClick={() => pushName('full')}>
              NAME + ALIAS
            </button>
            <span class="name-latest">{names[0] ?? '—'}</span>
            <span class="name-history">{names.slice(1).join('   ·   ')}</span>
          </div>
        )}

        {tables.length > 0 && (
          <div class="tables">
            {tables.map((t) => {
              const ri = rolls[t.id];
              const sub = t.id === 'district' && ri != null ? districtSub(t.items[ri]) : null;
              return (
                <div key={t.id} class="panel table-card">
                  <div class="table-head">
                    <div class="table-title">{t.title}</div>
                    <div class="table-die">{t.die}</div>
                    <div class="spacer" />
                    <button class="table-roll" onClick={() => roll(t.id)}>
                      ROLL
                    </button>
                  </div>
                  <div class="table-result">
                    <span class="arrow">⟶</span>
                    <span class="result">{ri == null ? '—' : t.items[ri]}</span>
                    <span class="rolled">{rolledLabel(rolls, t.id)}</span>
                  </div>
                  {sub && <div class="table-sub">{sub}</div>}
                  <div class="table-items">
                    {t.items.map((txt, i) => (
                      <div key={i} class={`table-item${ri === i ? ' hit' : ''}`}>
                        <span class="n">{i + 1}</span>
                        <span>{txt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------- engines

function EngineCard({ title, dark, rows, onRoll, foot }: { title: string; dark?: boolean; rows: EngineRow[]; onRoll: () => void; foot?: ComponentChildren }) {
  return (
    <div class={`engine${dark ? ' dark' : ''}`}>
      <div class="engine-head">
        <div class="engine-title">{title}</div>
        <div class="spacer" />
        <button class="roll-btn" onClick={onRoll}>
          ⚄ ROLL
        </button>
      </div>
      <div class="engine-body">
        {rows.map((r) => (
          <div key={r.k} class="engine-row">
            <span class="engine-k">{r.k}</span>
            <span class="engine-v">{r.v}</span>
            <button class="reroll" title="Reroll" onClick={r.re}>
              ⟳
            </button>
          </div>
        ))}
        {foot}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- faction finder

function FactionFinder({
  q,
  setQ,
  cats,
  toggleCat,
  pick,
  setPick,
  flashAdd,
  isOnTable,
  onAdd,
}: {
  q: string;
  setQ: (q: string) => void;
  cats: string[];
  toggleCat: (c: string) => void;
  pick: string | null;
  setPick: (id: string | null) => void;
  flashAdd: string | null;
  isOnTable: (ref: string) => boolean;
  onAdd: (f: Faction) => void;
}) {
  const ff = filteredFactions(q, cats);
  const fp = pick ? bookIndex.factions.get(pick) : undefined;
  const rollFaction = () => {
    if (ff.length) setPick(ff[rnd(ff)].id);
  };
  return (
    <div class="panel finder">
      <div class="finder-head">
        <div class="finder-title">Factions of Doskvol</div>
        <input
          class="finder-q"
          value={q}
          placeholder="search name / district…"
          onInput={(e) => setQ((e.currentTarget as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') rollFaction();
          }}
        />
        {FACTION_CATS.map((c) => (
          <button key={c} class={`cat-chip${cats.includes(c) ? ' on' : ''}`} onClick={() => toggleCat(c)}>
            {catShort(c)}
          </button>
        ))}
        <div class="spacer" />
        <span class="finder-count">
          {ff.length} / {finderFactions.length}
        </span>
        <button class="roll-btn" onClick={rollFaction}>
          ⚄ RANDOM
        </button>
      </div>
      {fp && (
        <div class="finder-pick">
          <span class="arrow">⟶</span>
          <span class="pick-name">{fp.name}</span>
          <span class="pick-meta">
            {catShort(fp.category)} · TIER {roman(fp.tier)}
            {fp.hold ? ` ${fp.hold.toUpperCase()}` : ''} · {String(fp.summary ?? '').slice(0, 90)}
          </span>
          <button class="pick-add" onClick={() => onAdd(fp)}>
            {flashAdd === fp.id ? 'ADDED ✓' : isOnTable(fp.id) ? 'ON NETWORK' : '+ ADD TO NETWORK'}
          </button>
        </div>
      )}
      <div class="finder-list">
        {ff.map((f) => (
          <div key={f.id} class="finder-row">
            <span class="fn">{f.name}</span>
            <span class="fc">{catShort(f.category)}</span>
            <span class="fth">
              {roman(f.tier)}
              {f.hold ? ` ${f.hold[0]}` : ''}
            </span>
            <span class="fd">{String(f.summary ?? '').slice(0, 72)}</span>
            <button class="frow-add" title="Add to the table" onClick={() => onAdd(f)}>
              {flashAdd === f.id ? '✓' : isOnTable(f.id) ? 'ON NETWORK' : '+ NETWORK'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- playbook prompts

function PlaybookPrompts({
  playbook,
  setPlaybook,
  rolls,
  rollPb,
  rollPbAll,
}: {
  playbook: string;
  setPlaybook: (p: string) => void;
  rolls: Rolls;
  rollPb: (cat: string) => void;
  rollPbAll: () => void;
}) {
  return (
    <div class="pb-wrap">
      <div class="pb-chips">
        {PLAYBOOK_NAMES.map((p) => (
          <button key={p} class={`pb-chip${playbook === p ? ' on' : ''}`} onClick={() => setPlaybook(p)}>
            {p}
          </button>
        ))}
        <button class="roll-btn pb-rollall" onClick={rollPbAll}>
          ⚄ ROLL ALL
        </button>
      </div>
      <div class="pb-grid">
        {sparks.playbookPromptCategories.map(([k, label]) => {
          const i = rolls[pbKey(playbook, k)];
          const items = pbItems(playbook, k);
          return (
            <div key={k} class="panel pb-card">
              <div class="pb-card-head">
                <span class="pb-label">{label.toUpperCase()}</span>
                <button class="reroll" title="Reroll" onClick={() => rollPb(k)}>
                  ⟳
                </button>
              </div>
              <div class="pb-v">{i == null ? '—' : items[i] ?? '—'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
