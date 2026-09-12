/**
 * The crew sheet (design/handoff/README.md "Crew sheet", rules-engine §4).
 * Rendered only once a crew type is chosen; the picker lives in index.tsx.
 */
import { useEffect, useState } from 'preact/hooks';
import { crewType, districtNames, roman, sheets, type NamedPair, type Upgrade } from '../../data';
import { crewNode } from '../../ledger/normalize';
import {
  canDevelop,
  claimKey,
  claimsMapFor,
  cohortStats,
  coinCap,
  COHORT_HARM,
  develop,
  developCost,
  isClaimHeld,
  isHubTile,
  newCohort,
  offPathClaims,
  repNeeded,
  resetCrewType,
  setCrewXp,
  setHeat,
  setRep,
  setUpgrade,
  spendCrewAdvance,
  toggleClaim,
  turfCount,
} from '../../ledger/rules';
import type { Cohort, CrewSheet as CrewSheetData } from '../../ledger/types';
import { useLedger } from '../../ui/context';
import { TrackBoxes, Triangles } from '../../ui/Track';
import { AbilityRow, Bar, Box, capitalize, Chip, Field, Panel, Seg, setRelation, toggleKey, useSheetWriters } from './bits';

const TIERS = ['0', 'I', 'II', 'III', 'IV'];
const HOLDS = [
  ['weak', 'WEAK'],
  ['strong', 'STRONG'],
] as const;
const KINDS = [
  ['gang', 'GANG'],
  ['expert', 'EXPERT'],
] as const;

const LAIR_HELP =
  'Your lair. Seize claims along the connectors from here; a held claim not linked back to the lair shows dashed red — exceptional, and may need investigation first.';
const CLAIMS_HELP = 'Hover a tile for its benefit. Click to seize or release it. Turf tiles count on the rep tracker.';

export function CrewSheet() {
  const { ledger, update, saveNode } = useLedger();
  const { editCrew } = useSheetWriters();
  const crew = ledger.sheets.crew;
  const ct = crewType(crew.type);
  const map = claimsMapFor(crew.type);
  const [armReset, setArmReset] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setArmReset(false);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, []);

  if (!ct || !map) return null;
  const edit = editCrew;
  const nodes = ledger.nodes;
  const turf = turfCount(crew, nodes);
  const need = repNeeded(crew, nodes);
  const cap = coinCap(crew);
  const offPath = offPathClaims(crew, map);
  const upgrades: (Upgrade & { own: boolean })[] = [...ct.upgrades.map((u) => ({ ...u, own: true })), ...sheets.generalUpgrades.map((u) => ({ ...u, own: false }))];
  const cohorts = Object.values(crew.cohorts).sort((a, b) => a.id.localeCompare(b.id));

  let focusName = 'CLAIMS';
  let focusText = CLAIMS_HELP;
  if (focus) {
    const [r, c] = focus.split(',').map(Number);
    const tile = map.tiles[r]?.[c];
    if (tile) {
      focusName = tile.toUpperCase();
      focusText = isHubTile(map, r, c) ? LAIR_HELP : (ct.benefits[tile] ?? '');
    }
  }

  const updateCohort = (coId: string, patch: Partial<Cohort>) =>
    edit((cw) => {
      const cur = cw.cohorts[coId];
      if (!cur) return cw;
      return { ...cw, cohorts: { ...cw.cohorts, [coId]: { ...cur, ...patch } } };
    });
  const removeCohort = (coId: string) =>
    edit((cw) => {
      const cohorts = { ...cw.cohorts };
      delete cohorts[coId];
      return { ...cw, cohorts };
    });

  const resetType = () => {
    edit((cw) => resetCrewType(cw));
    const node = crewNode(ledger);
    if (node && node.f.crewType) {
      const f = { ...node.f };
      delete f.crewType;
      saveNode(node, { ...node, f });
    }
    setArmReset(false);
  };

  return (
    <div class="sh-sheet">
      <div class="sh-sticky">
        <div class="sh-band">
          <div class="sh-band-main">
            <Field class="sh-name crew" value={ledger.crew.name} placeholder="CREW NAME" onCommit={(v) => update({ 'crew/name': v })} />
            <div class="sh-band-blurb">{ct.blurb}</div>
          </div>
          <div class="sh-band-side">
            <div class="sh-band-kicker">CREW</div>
            <div class="sh-band-type">{ct.name.toUpperCase()}</div>
            <div class="sh-band-tag">{ct.tagline}</div>
          </div>
        </div>

        <div class="sh-strip">
          <div class="sh-group">
            <div class="sh-group-head">
              <span class="sh-label">REP</span>
              <span class="sh-count">
                {crew.rep} / {need}
                {turf ? ` · ${turf} turf` : ''}
              </span>
              <span class="sh-spacer" />
              <span class="sh-label muted">TURF</span>
            </div>
            <div class="sh-group-body">
              <TrackBoxes count={12} filled={crew.rep} hatchedFrom={12 - turf} onSet={(v) => edit((cw, l) => setRep(cw, v, l.nodes))} />
              {canDevelop(crew, nodes) && (
                <button type="button" class="sh-badge big" onClick={() => edit((cw) => develop(cw))}>
                  {crew.hold === 'weak' ? 'DEVELOP → STRONG HOLD' : `DEVELOP → TIER ${roman(crew.tier + 1)} · ${developCost(crew)} COIN`}
                </button>
              )}
            </div>
          </div>

          <div class="sh-group">
            <div class="sh-group-head">
              <span class="sh-label">TIER</span>
            </div>
            <div class="sh-tier">
              {TIERS.map((label, i) => (
                <div key={label} class="sh-tier-cell">
                  <Box on={crew.tier === i} title={`Tier ${label}`} onClick={() => edit((cw) => ({ ...cw, tier: i }))} />
                  <span>{label}</span>
                </div>
              ))}
              <Seg class="sh-hold" options={HOLDS} value={crew.hold} onChange={(k) => edit((cw) => ({ ...cw, hold: k }))} />
            </div>
          </div>

          <div class="sh-group">
            <div class="sh-group-head">
              <span class="sh-label">HEAT</span>
              <span class="sh-count">{crew.heat} / 9</span>
              <span class="sh-spacer" />
              <span class="sh-label red">WANTED</span>
            </div>
            <div class="sh-group-body">
              <TrackBoxes count={9} filled={crew.heat} onSet={(v) => edit((cw) => setHeat(cw, v))} />
              <span class="sh-gap10" />
              <TrackBoxes count={4} filled={crew.wanted} red onSet={(v) => edit((cw) => ({ ...cw, wanted: Math.max(0, Math.min(4, v)) }))} />
            </div>
          </div>

          <div class="sh-group">
            <div class="sh-group-head">
              <span class="sh-label">COIN</span>
              <span class="sh-count">
                {crew.coin} / {cap}
              </span>
            </div>
            <div class="sh-group-body">
              <TrackBoxes class="wrap" count={cap} filled={crew.coin} size={20} gap={3} onSet={(v) => edit((cw) => ({ ...cw, coin: Math.max(0, v) }))} />
            </div>
          </div>

          <div class="sh-group">
            <div class="sh-group-head">
              <span class="sh-label">CREW XP</span>
            </div>
            <div class="sh-group-body">
              <TrackBoxes count={8} filled={crew.xp} size={20} onSet={(v) => edit((cw) => setCrewXp(cw, v).crew)} />
              {crew.advances > 0 && (
                <button
                  type="button"
                  class="sh-badge big"
                  title="Crew xp filled: take a special ability or two upgrade boxes, and pay each PC stash (+1, +2 per Tier). Click to spend."
                  onClick={() => edit((cw) => spendCrewAdvance(cw))}
                >
                  ADVANCE ×{crew.advances} · ABILITY or 2 UPGRADES
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div class="sh-body">
        {/* ------------------------------------------------ column 1 */}
        <div class="sh-col">
          <Panel>
            <Bar>
              <span>CLAIMS</span>
              <span class="sh-bar-note">TURF {turf} / 6</span>
            </Bar>
            <div class="sh-claims">
              {map.connections.map(([a, b], i) => {
                const on = isClaimHeld(crew, map, a[0], a[1]) && isClaimHeld(crew, map, b[0], b[1]);
                const style =
                  a[0] === b[0]
                    ? { gridRow: String(2 * a[0] + 1), gridColumn: String(2 * Math.min(a[1], b[1]) + 2), alignSelf: 'center', height: '12px' }
                    : { gridColumn: String(2 * a[1] + 1), gridRow: String(2 * Math.min(a[0], b[0]) + 2), justifySelf: 'center', width: '12px', height: '100%' };
                return <div key={i} class={`sh-conn${on ? ' is-on' : ''}`} style={style} />;
              })}
              {map.tiles.map((row, r) =>
                row.map((name, c) => {
                  const k = claimKey(r, c);
                  const lair = isHubTile(map, r, c);
                  const held = !!crew.claims[k];
                  const cls = ['sh-tile', lair ? 'is-lair' : held ? 'is-held' : '', offPath.has(k) ? 'is-off' : '', focus === k ? 'is-focus' : '']
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <button
                      type="button"
                      key={k}
                      class={cls}
                      style={{ gridRow: String(2 * r + 1), gridColumn: String(2 * c + 1) }}
                      onMouseEnter={() => setFocus(k)}
                      onFocus={() => setFocus(k)}
                      onClick={() => {
                        if (!lair) edit((cw) => toggleClaim(cw, map, r, c));
                        setFocus(k);
                      }}
                    >
                      {name.toUpperCase()}
                    </button>
                  );
                }),
              )}
            </div>
            <div class="sh-claim-info">
              <span class="sh-claim-name">{focusName}</span>
              {focusText}
            </div>
          </Panel>

          <Panel>
            <Bar>LAIR &amp; {ct.groundsLabel.toUpperCase()}</Bar>
            <div class="sh-lair">
              <div class="sh-id-group">
                <span class="sh-label small">REPUTATION</span>
                <div class="sh-chips">
                  {sheets.reputations.map((r) => (
                    <Chip key={r} on={crew.reputation === r} onClick={() => edit((cw) => ({ ...cw, reputation: cw.reputation === r ? '' : r }))}>
                      {r}
                    </Chip>
                  ))}
                </div>
              </div>
              <div class="sh-id-group">
                <span class="sh-label small">LAIR</span>
                <div class="sh-lair-row">
                  <Field class="sh-detail" value={crew.lair} placeholder="a shuttered lamp-shop, a junked rail-car…" onCommit={(v) => edit((cw) => ({ ...cw, lair: v }))} />
                  <DistrictSelect value={crew.lairDistrict} onChange={(v) => edit((cw) => ({ ...cw, lairDistrict: v }))} />
                </div>
              </div>
              <div class="sh-id-group">
                <span class="sh-label small">{ct.groundsLabel.toUpperCase()}</span>
                <div class="sh-lair-row">
                  <DistrictSelect value={crew.groundsDistrict} onChange={(v) => edit((cw) => ({ ...cw, groundsDistrict: v }))} />
                  <div class="sh-chips">
                    {ct.operations.map((o) => (
                      <Chip key={o.name} on={crew.operation === o.name} title={o.desc} onClick={() => edit((cw) => ({ ...cw, operation: cw.operation === o.name ? '' : o.name }))}>
                        {o.name}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div class="sh-note">+1d to gather information and a free extra downtime activity when preparing that operation type there.</div>
              </div>
              {ct.id === 'cult' && (
                <div class="sh-id-group">
                  <span class="sh-label small">DEITY</span>
                  <Field class="sh-detail" value={crew.deity} placeholder="name it, and two features…" onCommit={(v) => edit((cw) => ({ ...cw, deity: v }))} />
                  {ct.deity && <div class="sh-note">{ct.deity}</div>}
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* ------------------------------------------------ column 2 */}
        <div class="sh-col">
          <Panel rail>
            <Bar tone="dark">SPECIAL ABILITIES</Bar>
            <div>
              {ct.abilities.map((ab) => (
                <AbilityRow
                  key={ab.id}
                  on={!!crew.abilities[ab.id]}
                  name={ab.name}
                  text={ab.text}
                  note={ab.note}
                  onToggle={() => edit((cw) => ({ ...cw, abilities: toggleKey(cw.abilities, ab.id) }))}
                />
              ))}
            </div>
          </Panel>

          <Panel>
            <Bar>
              <span>UPGRADES</span>
              <span class="sh-bar-note">crew-specific in bold · boxes are the cost</span>
            </Bar>
            <div class="sh-items">
              {upgrades.map((u) => (
                <div key={u.id} class="sh-item" title={u.desc}>
                  <TrackBoxes count={u.boxes} filled={crew.upgrades[u.id] ?? 0} size={17} gap={2} onSet={(v) => edit((cw) => setUpgrade(cw, u.id, u.boxes, v))} />
                  <span class={`sh-item-name${u.own ? ' is-pb' : ''}`}>{u.name}</span>
                </div>
              ))}
            </div>
            <div class="sh-xp-text small">
              <div>
                <b>Crew xp</b>, 1 each at session end (2 if it happened a lot): {capitalize(ct.xp.replace(/\.\s*$/, ''))} · Contend with challenges above your
                current station · Bolster your crew's reputation or develop a new one · Express the goals, drives, inner conflict, or essential nature of the
                crew.
              </div>
            </div>
          </Panel>
        </div>

        {/* ------------------------------------------------ column 3 */}
        <div class="sh-col">
          <Panel>
            <Bar>
              <span>COHORTS</span>
              <span class="sh-spacer" />
              <button
                type="button"
                class="sh-btn"
                title="Recruiting a cohort costs two upgrades"
                onClick={() =>
                  edit((cw) => {
                    const co = newCohort('gang');
                    return { ...cw, cohorts: { ...cw.cohorts, [co.id]: co } };
                  })
                }
              >
                + COHORT
              </button>
            </Bar>
            {cohorts.length === 0 && (
              <div class="sh-empty-note">No gangs or experts yet. A gang has quality and scale equal to your Tier; an expert has quality Tier +1.</div>
            )}
            {cohorts.map((co) => (
              <CohortCard key={co.id} co={co} crew={crew} onChange={(p) => updateCohort(co.id, p)} onRemove={() => removeCohort(co.id)} />
            ))}
          </Panel>

          <Panel>
            <Bar>CONTACTS</Bar>
            {ct.contacts.map((c) => (
              <div key={c.name} class="sh-friend">
                <Triangles value={crew.contacts[c.name] ?? ''} onChange={(v) => edit((cw) => ({ ...cw, contacts: setRelation(cw.contacts, c.name, v) }))} />
                <span class="sh-friend-name">{c.name}</span>
                <span class="sh-friend-role">{c.role}</span>
              </div>
            ))}
          </Panel>

          <button type="button" class={`sh-danger${armReset ? ' is-armed' : ''}`} onClick={() => (armReset ? resetType() : setArmReset(true))}>
            {armReset ? '✕ CONFIRM — RESET CREW TYPE, ABILITIES, UPGRADES, CLAIMS' : 'CHANGE CREW TYPE'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DistrictSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select class="sh-select" value={value} onChange={(e) => onChange((e.currentTarget as HTMLSelectElement).value)}>
      <option value="">district…</option>
      {districtNames.map((d) => (
        <option key={d} value={d}>
          {d}
        </option>
      ))}
    </select>
  );
}

function CohortCard({ co, crew, onChange, onRemove }: { co: Cohort; crew: CrewSheetData; onChange: (p: Partial<Cohort>) => void; onRemove: () => void }) {
  const gang = co.kind !== 'expert';
  const st = cohortStats(co, crew);
  const chips = (list: NamedPair[], sel: string[], set: (v: string[]) => void, max: number) =>
    list.map(([t, d]) => {
      const on = sel.includes(t);
      return (
        <Chip
          key={t}
          on={on}
          title={d}
          onClick={() => {
            if (!on && sel.length >= max) return;
            set(on ? sel.filter((x) => x !== t) : [...sel, t]);
          }}
        >
          {t}
        </Chip>
      );
    });
  return (
    <div class="sh-cohort">
      <div class="sh-cohort-head">
        <Seg options={KINDS} value={co.kind} onChange={(k) => onChange({ kind: k })} />
        <Field class="sh-cohort-name" value={co.name} placeholder={gang ? 'the gang…' : 'the expert…'} onCommit={(v) => onChange({ name: v })} />
        <span class="sh-cohort-stat">
          QUALITY {st.quality} · SCALE {st.scale}
          {st.elite ? ' · ELITE' : ''}
        </span>
        <button type="button" class="sh-x" title="Disband" onClick={onRemove}>
          ✕
        </button>
      </div>
      {gang ? (
        <div class="sh-chips">{chips(sheets.cohort.gangTypes, co.types, (v) => onChange({ types: v }), 2)}</div>
      ) : (
        <Field
          class="sh-detail"
          value={co.expertType}
          placeholder="expertise — Doctor, Investigator, Occultist, Assassin, Spy…"
          onCommit={(v) => onChange({ expertType: v })}
        />
      )}
      <div class="sh-cohort-traits">
        <div class="sh-cohort-trait">
          <span class="sh-tag">EDGES</span>
          {chips(sheets.cohort.edges, co.edges, (v) => onChange({ edges: v }), 2)}
        </div>
        <div class="sh-cohort-trait">
          <span class="sh-tag">FLAWS</span>
          {chips(sheets.cohort.flaws, co.flaws, (v) => onChange({ flaws: v }), 2)}
        </div>
      </div>
      <div class="sh-cohort-harm">
        <span class="sh-tag">HARM</span>
        {[0, 1, 2, 3].map((i) => (
          <Box
            key={i}
            size={20}
            on={co.harm >= i + 1}
            title={sheets.cohort.harm[i]}
            onClick={() => onChange({ harm: (co.harm === i + 1 ? i : i + 1) as Cohort['harm'] })}
          />
        ))}
        <span class="sh-cohort-harm-name">{co.harm ? COHORT_HARM[co.harm] : 'unharmed'}</span>
        <span class="sh-tag">ARMOR</span>
        <Box size={20} on={co.armor} title="armor" onClick={() => onChange({ armor: !co.armor })} />
      </div>
    </div>
  );
}
