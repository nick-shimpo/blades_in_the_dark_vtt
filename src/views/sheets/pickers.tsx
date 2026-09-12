import { crewTypes, playbooks, type CrewTypeId, type PlaybookId } from '../../data';

export function EmptyState() {
  return (
    <div class="sh-empty">
      <h2>SHEETS</h2>
      <p>
        Pick a scoundrel or the crew on the left, or make a new scoundrel. Everything you'd pencil onto paper lives here: dots, stress, harm, load, coin,
        xp, claims.
      </p>
    </div>
  );
}

export function PlaybookPicker({ onPick, onCancel }: { onPick: (id: PlaybookId) => void; onCancel: () => void }) {
  return (
    <div class="sh-picker">
      <h2>CHOOSE A PLAYBOOK</h2>
      <div class="sub">Your playbook is your reputation in the underworld — what you're good at, and how you grow.</div>
      <div class="sh-picker-grid">
        {playbooks.map((p) => (
          <button type="button" key={p.id} class="sh-pick" onClick={() => onPick(p.id)}>
            <span class="sh-pick-name">{p.name.toUpperCase()}</span>
            <span class="sh-pick-tag">{p.tagline}</span>
            <span class="sh-pick-desc">
              Good at {p.picker?.goodAt ?? ''}. Play it to {p.picker?.playIf ?? ''}.
            </span>
          </button>
        ))}
      </div>
      <button type="button" class="sh-cancel" onClick={onCancel}>
        CANCEL
      </button>
    </div>
  );
}

export function CrewTypePicker({ onPick }: { onPick: (id: CrewTypeId) => void }) {
  return (
    <div class="sh-picker">
      <h2>CHOOSE A CREW TYPE</h2>
      <div class="sub">The crew type sets the group's purpose, its special abilities, and how it advances. You begin at Tier 0 with weak hold and 2 coin.</div>
      <div class="sh-picker-grid wide">
        {crewTypes.map((c) => (
          <button type="button" key={c.id} class="sh-pick" onClick={() => onPick(c.id)}>
            <span class="sh-pick-name">{c.name.toUpperCase()}</span>
            <span class="sh-pick-tag">{c.tagline}</span>
            <span class="sh-pick-desc">{c.blurb}</span>
            <span class="sh-pick-xp">
              <b>XP:</b> {c.xp}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
