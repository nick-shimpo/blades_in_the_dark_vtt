/**
 * Sheets view: left rail (crew + scoundrels) and the selected sheet, picker or empty state.
 * Only the selection, the trauma hint owner and the open roll dialog are local state;
 * everything else is read from the ledger on every render.
 */
import type { JSX } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { ATTRIBUTION, crewType, playbook, roman, type CrewTypeId, type PlaybookId } from '../../data';
import { blankCharacter, charactersInOrder, crewNode } from '../../ledger/normalize';
import { pickCrewType, stressMax } from '../../ledger/rules';
import { useLedger } from '../../ui/context';
import { CharacterSheet } from './CharacterSheet';
import { CrewSheet } from './CrewSheet';
import { CrewTypePicker, EmptyState, PlaybookPicker } from './pickers';
import { newRollState, RollDialog, type RollRequest, type RollState } from './RollDialog';
import './sheets.css';

type Sel = { kind: 'crew' } | { kind: 'char'; id: string } | { kind: 'pick' } | null;

export function SheetsView() {
  const { ledger, update, saveCrew, saveNode, store } = useLedger();
  const chars = charactersInOrder(ledger);
  const crew = ledger.sheets.crew;
  const ct = crewType(crew.type);

  const [sel, setSel] = useState<Sel>(() => (chars.length ? { kind: 'char', id: chars[0].id } : { kind: 'crew' }));
  const [traumaPick, setTraumaPick] = useState<string | null>(null);
  const [roll, setRoll] = useState<RollState | null>(null);

  const openRoll = useCallback((r: RollRequest) => setRoll(newRollState(r)), []);
  const closeRoll = useCallback(() => setRoll(null), []);
  const setRollFn = useCallback((fn: (prev: RollState | null) => RollState | null) => setRoll(fn), []);

  const newChar = (pb: PlaybookId) => {
    const ch = blankCharacter(pb);
    update({ [`sheets/chars/${ch.id}`]: ch });
    setSel({ kind: 'char', id: ch.id });
  };

  const pickType = (id: CrewTypeId) => {
    const live = store.current() ?? ledger;
    const before = live.sheets.crew;
    saveCrew(before, pickCrewType(before, id));
    // rules §5: the Table crew card shows the crew type once it is chosen
    const node = crewNode(live);
    const name = crewType(id)?.name ?? '';
    if (node && node.f.crewType !== name) saveNode(node, { ...node, f: { ...node.f, crewType: name } });
  };

  let main: JSX.Element;
  if (!sel) main = <EmptyState />;
  else if (sel.kind === 'pick') main = <PlaybookPicker onPick={newChar} onCancel={() => setSel(null)} />;
  else if (sel.kind === 'crew') main = ct ? <CrewSheet /> : <CrewTypePicker onPick={pickType} />;
  else if (!ledger.sheets.chars[sel.id]) main = <EmptyState />;
  else
    main = (
      <CharacterSheet
        key={sel.id}
        id={sel.id}
        traumaPick={traumaPick}
        setTraumaPick={setTraumaPick}
        onRoll={openRoll}
        onRemoved={() => setSel(null)}
      />
    );

  return (
    <div class="sheets">
      <aside class="sh-rail">
        <div class="sh-rail-label">THE CREW</div>
        <button type="button" class={`sh-card${sel?.kind === 'crew' ? ' is-on' : ''}`} onClick={() => setSel({ kind: 'crew' })}>
          <span class="sh-card-name">{ledger.crew.name || 'The Crew'}</span>
          <span class="sh-card-sub">{ct ? `${ct.name} · Tier ${roman(crew.tier)} · ${crew.hold} hold` : 'choose a crew type'}</span>
        </button>
        <div class="sh-rail-label">SCOUNDRELS</div>
        {chars.map((ch) => (
          <button
            type="button"
            key={ch.id}
            class={`sh-card${sel?.kind === 'char' && sel.id === ch.id ? ' is-on' : ''}`}
            onClick={() => setSel({ kind: 'char', id: ch.id })}
          >
            <span class="sh-card-name">{ch.name || 'Unnamed'}</span>
            <span class="sh-card-sub">
              {playbook(ch.playbook)?.name ?? ch.playbook} · stress {ch.stress}/{stressMax(ch, crew)}
            </span>
          </button>
        ))}
        <button type="button" class="sh-new" onClick={() => setSel({ kind: 'pick' })}>
          + NEW SCOUNDREL
        </button>
        <div class="sh-rail-spacer" />
        <div class="sh-rail-attrib">{ATTRIBUTION}</div>
      </aside>
      <section class="sh-main">{main}</section>
      {roll && <RollDialog roll={roll} setRoll={setRollFn} onClose={closeRoll} onTrauma={setTraumaPick} />}
    </div>
  );
}
