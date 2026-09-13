/**
 * Sheet 7: xp triggers and advances for scoundrels and the crew, rep, hold, Tier and faction
 * status (core rulebook pp. 44 to 49; status words from the bundled sheet data).
 */
import { sheets } from '../../../data';
import { Label, List, Note, Panel, RefSheet, Rows, Table } from './bits';

const STATUS_LINES: Record<string, string> = {
  '3': 'help even against their interest',
  '2': 'help unless it causes serious problems',
  '1': 'help if there is no cost',
  '0': 'the default starting status',
  '-1': '',
  '-2': '',
  '-3': 'see the war effects below',
};

export function AdvancementSheet() {
  return (
    <RefSheet
      title="Advancement & the Faction Game"
      sub="Mark xp at the end of every session; fill a track to advance. Rep, hold and Tier are how the crew grows."
      pages="pp. 44–49"
    >
      <Panel title="SCOUNDREL XP" note="1 xp, or 2 if it happened a lot">
        <p>
          When you make a <b>desperate</b> action roll, mark 1 xp in the attribute for the action you rolled. At the end of the session, for
          each trigger, mark 1 xp if it happened at all, or 2 xp if it happened a lot:
        </p>
        <List
          items={[
            'Your playbook trigger (below).',
            'You expressed your beliefs, drives, heritage, or background.',
            'You struggled with issues from your vice or traumas.',
          ]}
        />
        <Note>
          You may mark end-of-session xp on any xp tracks you want (any attribute or your playbook xp track). Training in downtime marks 1
          xp in one track (2 with the matching crew Training upgrade), once per track per downtime.
        </Note>
        <Label>Playbook triggers: you addressed a challenge with...</Label>
        <Rows
          rows={[
            ['Cutter', 'violence or coercion'],
            ['Hound', 'tracking or violence'],
            ['Leech', 'technical skill or mayhem'],
            ['Lurk', 'stealth or evasion'],
            ['Slide', 'deception or influence'],
            ['Spider', 'calculation or conspiracy'],
            ['Whisper', 'knowledge or arcane power'],
          ]}
        />
      </Panel>

      <Panel title="ADVANCES" note="playbook track 8, attribute tracks 6">
        <Rows
          rows={[
            ['Playbook (8)', 'Fill it: clear the track and take an additional special ability (from your playbook, or another as a Veteran advance).'],
            ['Attribute (6)', 'Fill it: clear the track and add an action dot to one of the actions under that attribute.'],
            ['Caps', 'No action may have more than two dots at creation. After creation, action ratings may advance up to 3. With the crew’s Mastery upgrade, up to 4.'],
          ]}
        />
      </Panel>

      <Panel title="CREW XP" note="crew track 8">
        <p>At the end of the session, 1 xp each, or 2 if it occurred multiple times or in a major way:</p>
        <List
          items={[
            'Your crew-specific trigger.',
            'Contend with challenges above your current station.',
            'Bolster your crew’s reputation or develop a new one.',
            'Express the goals, drives, inner conflict, or essential nature of the crew.',
          ]}
        />
        <Rows
          rows={[
            ['Crew advance', 'Clear the marks and take a new special ability or mark two crew upgrade boxes.'],
            ['Profits', 'Then each PC gets +1 stash (+2 per crew Tier).'],
          ]}
        />
      </Panel>

      <Panel title="REP, HOLD & TIER" note="rep tracker 12; max 6 turf">
        <Rows
          rows={[
            ['Rep', 'Earned per score equal to the target’s Tier; zero if kept completely quiet. As long as your rep tracker is full, you don’t earn new rep.'],
            ['Turf', 'Each piece of turf you hold reduces the rep cost to develop by one (marked from the right-hand end). You can hold a maximum of 6 turf; the minimum rep cost is always 6.'],
            ['Weak hold', 'When the tracker fills with weak hold, hold becomes strong and rep resets.'],
            ['Strong hold', 'When the tracker fills with strong hold, pay coin equal to the new Tier × 8 to go up a Tier; rep resets and hold drops to weak.'],
            ['Losing hold', 'An enemy operation can drop hold one step; weak hold dropping loses a Tier. At war the crew temporarily loses 1 hold.'],
          ]}
        />
        <Label>Tier advancement cost</Label>
        <Table
          head={['To Tier', 'I', 'II', 'III', 'IV', 'V']}
          rows={[['Coin', '8', '16', '24', '32', '40']]}
        />
        <Label>Gang scale by Tier</Label>
        <Table
          head={['Tier', '0', 'I', 'II', 'III', 'IV', 'V']}
          rows={[['People', '1–2', '3–6 small', '12 medium', '20 large', '40 huge', '80 massive']]}
        />
      </Panel>

      <Panel title="FACTION STATUS" note="−3 to +3, zero is neutral">
        <Table
          head={['Status', 'Word', 'They...']}
          rows={['3', '2', '1', '0', '-1', '-2', '-3'].map((s) => [
            <span class={Number(s) < 0 ? 'rf-em' : undefined}>{Number(s) > 0 ? `+${s}` : s.replace('-', '−')}</span>,
            sheets.statusWords[s],
            STATUS_LINES[s],
          ])}
        />
        <Label>At war (−3) with anyone</Label>
        <List items={['+1 heat from scores.', 'Temporarily −1 hold.', 'PCs get one downtime activity instead of two.']} />
        <Note>
          After an operation: −1 or −2 status with factions you hurt, +1 with a faction you helped; nothing if you kept it quiet. Seizing a
          claim is usually −2 with the faction that held it.
        </Note>
      </Panel>
    </RefSheet>
  );
}
