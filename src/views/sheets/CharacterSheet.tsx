/**
 * One scoundrel's sheet (design/handoff/README.md "Character sheet", rules-engine §2).
 * Everything is derived from the ledger on every render; only transient UI state lives here.
 */
import { Fragment } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  ACTIONS_BY_ATTRIBUTE,
  ATTRIBUTES,
  allItemsFor,
  playbook,
  playbookAbility,
  playbooks,
  sheets,
  type NamedPair,
  type PlaybookId,
} from '../../data';
import {
  attrRating,
  clearHarmCell,
  coinToStash,
  harmPenalty,
  harmSlot,
  hasAbility,
  hasSpecialArmor,
  healTick,
  LIFESTYLE_WORDS,
  lifestyle,
  loadLimits,
  loadUsed,
  recordHarm,
  restoreArmor,
  setAction,
  setStress,
  setXp,
  spendAdvance,
  stashToCoin,
  stressMax,
  toggleTraumaCondition,
  traumaMax,
  type HarmLevel,
} from '../../ledger/rules';
import type { CharacterSheet as CharacterSheetData, HarmRows, LoadClass } from '../../ledger/types';
import { Clock } from '../../ui/Clock';
import { useLedger } from '../../ui/context';
import { RatingDots, TrackBoxes, Triangles } from '../../ui/Track';
import { AbilityRow, Bar, Box, Chip, Field, Panel, Seg, setRelation, toggleKey, useSheetWriters } from './bits';
import type { RollRequest } from './RollDialog';

const LOAD_OPTIONS: readonly (readonly [LoadClass, string])[] = [
  ['light', 'LIGHT'],
  ['normal', 'NORMAL'],
  ['heavy', 'HEAVY'],
];

const IDENTITY: {
  label: string;
  field: 'heritage' | 'background' | 'vice';
  detail: 'heritageDetail' | 'backgroundDetail' | 'viceDetail';
  opts: NamedPair[];
  ph: string;
}[] = [
  { label: 'HERITAGE', field: 'heritage', detail: 'heritageDetail', opts: sheets.heritage, ph: 'a detail about your family life…' },
  { label: 'BACKGROUND', field: 'background', detail: 'backgroundDetail', opts: sheets.background, ph: 'your specific history…' },
  { label: 'VICE', field: 'vice', detail: 'viceDetail', opts: sheets.vice, ph: 'the details, and your purveyor…' },
];

const ARMOR: readonly (readonly ['armor' | 'heavy' | 'special', string])[] = [
  ['armor', 'ARMOR'],
  ['heavy', 'HEAVY'],
  ['special', 'SPECIAL'],
];

export interface CharacterSheetProps {
  id: string;
  /** Character currently owed a trauma condition (set when a stress change tipped them over). */
  traumaPick: string | null;
  setTraumaPick: (id: string | null) => void;
  onRoll: (r: RollRequest) => void;
  onRemoved: () => void;
}

export function CharacterSheet({ id, traumaPick, setTraumaPick, onRoll, onRemoved }: CharacterSheetProps) {
  const { ledger, update } = useLedger();
  const { editChar } = useSheetWriters();
  const ch = ledger.sheets.chars[id];
  const crew = ledger.sheets.crew;
  const [armDel, setArmDel] = useState(false);
  const [fatal, setFatal] = useState(false);
  const [vetPb, setVetPb] = useState<PlaybookId | null>(null);
  const harmRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Esc clears the transient states (arm, fatal banner, trauma hint). Dialogs swallow Esc first.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setArmDel(false);
      setFatal(false);
      if (traumaPick === id) setTraumaPick(null);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [id, traumaPick, setTraumaPick]);

  if (!ch) return null;
  const pb = playbook(ch.playbook);
  if (!pb) return null;
  const edit = (fn: (c: CharacterSheetData, crew: typeof ledger.sheets.crew) => CharacterSheetData | null | undefined) => editChar(id, fn);

  // ---- derived
  const smax = stressMax(ch, crew);
  const tmax = traumaMax(crew);
  const traumaHint =
    traumaPick === id && ch.traumaConds.length < ch.trauma ? 'trauma — choose a condition' : ch.trauma >= tmax ? 'four trauma — retire or take the fall' : '';
  const specialOk = hasSpecialArmor(ch);
  const limits = loadLimits(ch);
  const used = loadUsed(ch);
  const limit = limits[ch.load];
  const over = used > limit;
  const items = allItemsFor(pb);
  const vigorous = hasAbility(ch, 'vigorous');
  const pbAdv = ch.advances.playbook ?? 0;
  const others = playbooks.filter((p) => p.id !== pb.id);
  const vpb = playbooks.find((p) => p.id === vetPb) ?? others[0];
  const life = lifestyle(ch.stash);

  // ---- harm
  const takeHarm = (level: HarmLevel) => {
    const slot = harmSlot(ch, level);
    if (slot.level === 4) {
      setFatal(true);
      return;
    }
    setFatal(false);
    harmRefs.current[`${slot.level}:${slot.index}`]?.focus();
  };
  const setHarmText = (level: HarmLevel, index: number, text: string) =>
    edit((c) => {
      const key = String(level) as keyof HarmRows;
      const cur = (c.harm[key] as string[])[index] ?? '';
      if (!text.trim()) return cur.trim() ? clearHarmCell(c, level, index) : c;
      if (!cur.trim()) return recordHarm(c, level, index, text); // a new injury resets the healing clock
      const row = [...(c.harm[key] as string[])];
      row[index] = text;
      return { ...c, harm: { ...c.harm, [key]: row } as HarmRows };
    });

  return (
    <div class="sh-sheet">
      <div class="sh-sticky">
        <div class="sh-band">
          <div class="sh-band-main">
            <div class="sh-band-row">
              <Field class="sh-name" value={ch.name} placeholder="NAME" onCommit={(v) => edit((c) => ({ ...c, name: v }))} />
              <Field class="sh-alias" value={ch.alias} placeholder="alias" onCommit={(v) => edit((c) => ({ ...c, alias: v }))} />
            </div>
            <Field class="sh-look" value={ch.look} placeholder="look — a few evocative words" onCommit={(v) => edit((c) => ({ ...c, look: v }))} />
          </div>
          <div class="sh-band-side">
            <div class="sh-band-kicker">PLAYBOOK</div>
            <div class="sh-band-type">{pb.name.toUpperCase()}</div>
            <div class="sh-band-tag">{pb.tagline}</div>
          </div>
        </div>

        <div class="sh-strip">
          <div class="sh-group">
            <div class="sh-group-head">
              <span class="sh-label">STRESS</span>
              <span class="sh-count">
                {ch.stress} / {smax}
              </span>
            </div>
            <div class="sh-group-body">
              <TrackBoxes
                count={smax}
                filled={ch.stress}
                onSet={(v) =>
                  edit((c, cw) => {
                    const r = setStress(c, cw, v);
                    if (r.trauma) setTraumaPick(id);
                    return r.char;
                  })
                }
              />
            </div>
          </div>

          <div class="sh-group">
            <div class="sh-group-head">
              <span class="sh-label">TRAUMA</span>
              {traumaHint && <span class="sh-hint">{traumaHint}</span>}
            </div>
            <div class="sh-group-body">
              <TrackBoxes count={tmax} filled={ch.trauma} onSet={(v) => edit((c) => ({ ...c, trauma: Math.max(0, v) }))} />
              <div class="sh-trauma-chips">
                {sheets.trauma.map(([name, desc]) => (
                  <Chip
                    key={name}
                    on={ch.traumaConds.includes(name)}
                    title={desc}
                    onClick={() => {
                      edit((c) => toggleTraumaCondition(c, name));
                      if (traumaPick === id) setTraumaPick(null);
                    }}
                  >
                    {name}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <div class="sh-group">
            <div class="sh-group-head">
              <span class="sh-label">ARMOR</span>
              <button type="button" class="sh-restore" title="Downtime: restore all armor" onClick={() => edit((c) => restoreArmor(c))}>
                restore
              </button>
            </div>
            <div class="sh-armor">
              {ARMOR.map(([k, label]) => {
                const ok = k !== 'special' || specialOk;
                return (
                  <div key={k} class={`sh-armor-cell${ok ? '' : ' is-off'}`}>
                    <Box
                      on={!!ch.armor[k]}
                      dashed={!ok}
                      title={
                        ok
                          ? `${label.toLowerCase()} — mark it to reduce or avoid a consequence instead of resisting; restored at downtime`
                          : 'Special armor needs an ability that grants it'
                      }
                      onClick={() => {
                        if (!ok) return;
                        edit((c) => {
                          const armor = { ...c.armor };
                          if (armor[k]) delete armor[k];
                          else armor[k] = true;
                          return { ...c, armor };
                        });
                      }}
                    />
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div class="sh-group">
            <div class="sh-group-head">
              <span class="sh-label">LOAD</span>
              <span class={`sh-count${over ? ' is-over' : ''}`}>
                {used} / {limit}
              </span>
            </div>
            <Seg
              options={LOAD_OPTIONS.map(([k, l]) => [k, `${l} ${limits[k]}`] as const)}
              value={ch.load}
              onChange={(k) => edit((c) => ({ ...c, load: k }))}
            />
          </div>

          <div class="sh-group">
            <div class="sh-group-head">
              <span class="sh-label">COIN</span>
            </div>
            <div class="sh-group-body">
              <TrackBoxes count={4} filled={ch.coin} onSet={(v) => edit((c) => ({ ...c, coin: Math.max(0, v) }))} />
            </div>
          </div>
        </div>
      </div>

      <div class="sh-body">
        {/* ------------------------------------------------ column 1 */}
        <div class="sh-col">
          <Panel>
            <Bar tone="ink">
              <span>HARM</span>
              <span class="sh-bar-note">click a level number to record harm</span>
            </Bar>
            <div class="sh-harm">
              <div class="sh-harm-grid">
                {([3, 2, 1] as HarmLevel[]).map((L) => {
                  const key = String(L) as keyof HarmRows;
                  const cells = ch.harm[key] as string[];
                  return (
                    <Fragment key={L}>
                      <button type="button" class="sh-harm-level" title={`Record level ${L} harm — moves up a level if the row is full`} onClick={() => takeHarm(L)}>
                        {L}
                      </button>
                      <div class="sh-harm-cells">
                        {cells.map((val, i) => (
                          <Field
                            key={i}
                            class="sh-harm-input"
                            value={val}
                            placeholder={i === 0 ? (sheets.harmExamples[key] ?? '').split(',')[0].trim().toLowerCase() : ''}
                            inputRef={(el) => {
                              harmRefs.current[`${L}:${i}`] = el;
                            }}
                            onCommit={(v) => setHarmText(L, i, v)}
                          />
                        ))}
                      </div>
                      <div class="sh-harm-pen">{harmPenalty(ch, L)}</div>
                    </Fragment>
                  );
                })}
              </div>
              <div class="sh-heal">
                <Clock
                  size={4}
                  filled={Math.max(vigorous ? 1 : 0, ch.healing)}
                  diameter={58}
                  title="Healing clock — click to tick, right-click to untick. Filling it reduces every harm one level."
                  onTick={(d) => edit((c) => healTick(c, d))}
                />
                <span class="sh-tag">HEALING</span>
              </div>
            </div>
            {fatal && (
              <div class="sh-fatal">
                <span>No room left — this is level 4 harm. Fatal unless resisted.</span>
                <button type="button" onClick={() => setFatal(false)} aria-label="dismiss">
                  ✕
                </button>
              </div>
            )}
          </Panel>

          {ATTRIBUTES.map((attr) => {
            const rating = attrRating(ch, attr);
            const adv = ch.advances[attr] ?? 0;
            const xp = ch.xp[attr] ?? 0;
            return (
              <Panel key={attr}>
                <Bar tone="ink" class="sh-attr-bar">
                  <span>{attr.toUpperCase()}</span>
                  <button
                    type="button"
                    class="sh-attr-rating"
                    title={`Resistance roll with ${attr} (${rating}d)`}
                    onClick={() => onRoll({ kind: 'resist', charId: id, attr })}
                  >
                    {rating}
                  </button>
                  <span class="sh-spacer" />
                  {adv > 0 && (
                    <button
                      type="button"
                      class="sh-badge"
                      title="An attribute track filled: add one dot to an action below, then click to spend the advance"
                      onClick={() => edit((c) => spendAdvance(c, attr))}
                    >
                      ADVANCE ×{adv} · +1 DOT
                    </button>
                  )}
                  <div class="sh-xp">
                    <span class="sh-xp-label">XP</span>
                    {Array.from({ length: 6 }, (_, i) => (
                      <Box
                        key={i}
                        inverse
                        size={16}
                        on={i < xp}
                        title={`${i + 1} of 6`}
                        onClick={() => edit((c) => setXp(c, attr, i + 1 === (c.xp[attr] ?? 0) ? i : i + 1).char)}
                      />
                    ))}
                  </div>
                </Bar>
                <div class="sh-actions">
                  {ACTIONS_BY_ATTRIBUTE[attr].map((a) => {
                    const r = ch.actions[a] ?? 0;
                    return (
                      <div class="sh-action" key={a}>
                        <RatingDots value={r} max={4} onSet={(v) => edit((c, cw) => setAction(c, cw, a, v))} />
                        <button
                          type="button"
                          class="sh-action-name"
                          title={`When you ${sheets.actionDesc[a]}. Click to roll.`}
                          onClick={() => onRoll({ kind: 'action', charId: id, action: a, attr })}
                        >
                          {a}
                        </button>
                        <span class="sh-pool">{r}D</span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            );
          })}

          <div class="sh-bonus">
            <b>Bonus dice.</b> Push yourself: 2 stress for +1d, +1 effect, or to act while incapacitated. Devil's Bargain: +1d for a complication (doesn't stack
            with pushing for +1d). Assist: a teammate takes 1 stress to give you +1d.
          </div>
        </div>

        {/* ------------------------------------------------ column 2 */}
        <div class="sh-col">
          <Panel rail>
            <Bar tone="dark">
              <span>SPECIAL ABILITIES</span>
              <span class="sh-spacer" />
              {pbAdv > 0 && (
                <button
                  type="button"
                  class="sh-badge"
                  title="Your playbook track filled: tick a new ability, then click to spend the advance"
                  onClick={() => edit((c) => spendAdvance(c, 'playbook'))}
                >
                  ADVANCE ×{pbAdv} · NEW ABILITY
                </button>
              )}
            </Bar>
            <div>
              {pb.abilities.map((ab) => (
                <AbilityRow
                  key={ab.id}
                  on={!!ch.abilities[ab.id]}
                  name={ab.name}
                  text={ab.text}
                  note={ab.note}
                  onToggle={() => edit((c) => ({ ...c, abilities: toggleKey(c.abilities, ab.id) }))}
                />
              ))}
              {ch.veteran.map((vt) => {
                const opb = playbook(vt.pb);
                const ab = playbookAbility(vt.pb, vt.id);
                if (!opb || !ab) return null;
                return (
                  <AbilityRow
                    key={`${vt.pb}:${vt.id}`}
                    on
                    name={ab.name}
                    text={ab.text}
                    note={ab.note}
                    from={`VETERAN · ${opb.name.toUpperCase()}`}
                    onRemove={() => edit((c) => ({ ...c, veteran: c.veteran.filter((x) => !(x.pb === vt.pb && x.id === vt.id)) }))}
                  />
                );
              })}
            </div>
            <div class="sh-vet">
              <span class="sh-label small">VETERAN</span>
              <select class="sh-select" value={vpb.id} onChange={(e) => setVetPb((e.currentTarget as HTMLSelectElement).value as PlaybookId)}>
                {others.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                class="sh-select grow"
                value=""
                onChange={(e) => {
                  const sel = e.currentTarget as HTMLSelectElement;
                  const abId = sel.value;
                  sel.value = '';
                  if (!abId) return;
                  edit((c) => (c.veteran.some((x) => x.pb === vpb.id && x.id === abId) ? c : { ...c, veteran: [...c.veteran, { pb: vpb.id, id: abId }] }));
                }}
              >
                <option value="">add an ability from that playbook…</option>
                {vpb.abilities
                  .filter((ab) => !ch.veteran.some((x) => x.pb === vpb.id && x.id === ab.id))
                  .map((ab) => (
                    <option key={ab.id} value={ab.id}>
                      {ab.name}
                    </option>
                  ))}
              </select>
            </div>
          </Panel>

          <Panel>
            <Bar>
              <span>PLAYBOOK XP</span>
              <span class="sh-spacer" />
              <TrackBoxes count={8} filled={ch.xp.playbook ?? 0} size={16} gap={3} onSet={(v) => edit((c) => setXp(c, 'playbook', v).char)} />
            </Bar>
            <div class="sh-xp-text">
              <div>
                <b>Desperate roll:</b> mark 1 xp in that attribute (done for you when you roll from here).
              </div>
              <div>At the end of the session, mark 1 xp for each — 2 if it happened a lot:</div>
              <div class="sh-bullet">◆ {pb.xp}</div>
              <div class="sh-bullet">◆ You expressed your beliefs, drives, heritage, or background.</div>
              <div class="sh-bullet">◆ You struggled with issues from your vice or traumas.</div>
              {hasAbility(ch, 'vengeful') && <div class="sh-bullet">◆ You got payback against someone who harmed you or someone you care about.</div>}
            </div>
          </Panel>

          <Panel>
            <Bar>{pb.friendsBar || 'FRIENDS, RIVALS'}</Bar>
            {pb.friends.map((f) => (
              <div key={f.name} class="sh-friend" title={f.prompt}>
                <Triangles value={ch.friends[f.name] ?? ''} onChange={(v) => edit((c) => ({ ...c, friends: setRelation(c.friends, f.name, v) }))} />
                <span class="sh-friend-name">{f.name}</span>
                <span class="sh-friend-role">{f.role}</span>
              </div>
            ))}
          </Panel>
        </div>

        {/* ------------------------------------------------ column 3 */}
        <div class="sh-col">
          <Panel>
            <Bar>
              <span>ITEMS</span>
              <span class={`sh-bar-note${over ? ' is-over' : ''}`}>
                {used} / {limit} · {ch.load}
              </span>
            </Bar>
            <div class="sh-items">
              {items.map((it) => {
                const on = !!ch.items[it.id];
                const variable = 'variable' in it && !!it.variable;
                const tip = `${it.desc}${it.load ? ` [${it.load}${variable ? '+' : ''} load]` : ' [no load]'}`;
                const toggle = () => edit((c) => ({ ...c, items: toggleKey(c.items, it.id) }));
                return (
                  <div key={it.id} class="sh-item" title={tip}>
                    <div class="sh-item-boxes">
                      {Array.from({ length: Math.max(1, it.load) }, (_, i) => (
                        <Box key={i} size={17} on={on} round={!it.load} title={it.name} onClick={toggle} />
                      ))}
                    </div>
                    <span class={`sh-item-name${it.kind === 'playbook' ? ' is-pb' : ''}${it.load ? '' : ' is-free'}`}>{it.name}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <Bar>
              <span>STASH</span>
              <span class="sh-bar-note">
                {ch.stash} / 40 · lifestyle {life} — {LIFESTYLE_WORDS[life]}
              </span>
            </Bar>
            <div class="sh-stash">
              {[0, 1, 2, 3].map((r) => (
                <div key={r} class="sh-stash-row">
                  <TrackBoxes
                    count={10}
                    filled={Math.max(0, Math.min(10, ch.stash - 10 * r))}
                    size={17}
                    onSet={(v) => edit((c) => ({ ...c, stash: Math.max(0, Math.min(40, 10 * r + v)) }))}
                  />
                  <span class="sh-stash-n">{r + 1}</span>
                </div>
              ))}
              <div class="sh-stash-btns">
                <button type="button" class="sh-btn" disabled={!stashToCoin(ch)} onClick={() => edit((c) => stashToCoin(c))}>
                  2 STASH → 1 COIN
                </button>
                <button type="button" class="sh-btn" disabled={!coinToStash(ch)} onClick={() => edit((c) => coinToStash(c))}>
                  1 COIN → STASH
                </button>
              </div>
            </div>
          </Panel>

          <Panel>
            <Bar>HERITAGE · BACKGROUND · VICE</Bar>
            <div class="sh-identity">
              {IDENTITY.map((g) => (
                <div key={g.field} class="sh-id-group">
                  <span class="sh-label small">{g.label}</span>
                  <div class="sh-chips">
                    {g.opts.map(([n, d]) => (
                      <Chip key={n} on={ch[g.field] === n} title={d} onClick={() => edit((c) => ({ ...c, [g.field]: c[g.field] === n ? '' : n }))}>
                        {n}
                      </Chip>
                    ))}
                  </div>
                  <Field class="sh-detail" value={ch[g.detail]} placeholder={g.ph} onCommit={(v) => edit((c) => ({ ...c, [g.detail]: v }))} />
                </div>
              ))}
            </div>
          </Panel>

          <button
            type="button"
            class={`sh-danger${armDel ? ' is-armed' : ''}`}
            onClick={() => {
              if (!armDel) {
                setArmDel(true);
                return;
              }
              update({ [`sheets/chars/${id}`]: null });
              onRemoved();
            }}
          >
            {armDel ? '✕ CONFIRM — REMOVE THIS SHEET' : 'REMOVE SHEET'}
          </button>
        </div>
      </div>
    </div>
  );
}
