/** Sheet 4: the four teamwork maneuvers and their stress rules (core rulebook pp. 134 to 135). */
import { Note, Panel, RefSheet, Rows, Table } from './bits';

export function TeamworkSheet() {
  return (
    <RefSheet
      title="Teamwork"
      sub="Four maneuvers any scoundrel can offer a teammate; they are listed at the bottom of every playbook sheet."
      pages="pp. 134–135"
    >
      <Panel title="ASSIST" note="1 stress">
        <p>
          Take 1 stress, say how you help, and give a teammate <b>+1d</b> on their roll. Only one assist per roll. You may share the
          consequences of the roll.
        </p>
      </Panel>

      <Panel title="LEAD A GROUP ACTION" note="1 stress per 1–3">
        <p>
          Everyone involved rolls the same action; the <b>best result counts for all</b>. The leader takes <b>1 stress for each PC</b> whose
          best result was 1 to 3.
        </p>
        <Note>
          Cohorts can be led: roll Command to direct them, or your own action if you take part; the cohort rolls its quality.
        </Note>
      </Panel>

      <Panel title="PROTECT" note="you take the consequence">
        <p>
          Face a consequence in a teammate's place. You may <b>resist it as normal</b> (roll the attribute, suffer 6 stress minus the
          highest die).
        </p>
      </Panel>

      <Panel title="SET UP" note="your own action roll">
        <p>
          If your action succeeds, the teammates who follow up get <b>+1 effect</b> or an <b>improved position</b>.
        </p>
        <Note>
          A successful setup maneuver can improve position for teammates (possibly offsetting a bad engagement roll) or give increased
          effect. An unsuccessful setup maneuver might cause trouble for the second part of the plan; an easy consequence is to give the
          engagement roll −1d.
        </Note>
      </Panel>

      <Panel title="STRESS AT A GLANCE" wide>
        <Table
          head={['Maneuver', 'Who pays', 'Stress', 'Effect']}
          rows={[
            ['Assist', 'The helper', '1', '+1d to the teammate; one assist per roll'],
            ['Lead a group action', 'The leader', '1 per PC who rolled 1–3', 'Best result counts for the whole group'],
            ['Protect', 'The protector', 'The consequence (resistable: 6 − highest die)', 'The teammate is spared it'],
            ['Set up', '—', 'None listed (it is your own action roll)', 'Followers get +1 effect or improved position'],
          ]}
        />
      </Panel>

      <Panel title="BONUS DICE REMINDER" wide>
        <Rows
          rows={[
            ['Push yourself', 'Take 2 stress for +1d, or +1 effect, or to act while incapacitated (each once per action).'],
            ['Devil\'s Bargain', '+1d in exchange for a complication the GM or another player offers. Push and bargain do not stack for the same die.'],
            ['Assist', 'A teammate takes 1 stress to give you +1d.'],
          ]}
        />
      </Panel>
    </RefSheet>
  );
}
