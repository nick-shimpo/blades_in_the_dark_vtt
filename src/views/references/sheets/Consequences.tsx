/**
 * Sheet 3: consequences, harm, armor, resistance, stress, trauma and death
 * (core rulebook pp. 27 and 30 to 33; harm examples and trauma text from the bundled sheet data).
 */
import { sheets } from '../../../data';
import { Label, Note, Panel, RefSheet, Rows, Table } from './bits';

export function ConsequencesSheet() {
  return (
    <RefSheet
      title="Consequences & Resistance"
      sub="PCs have effect on the world around them and they suffer consequences in return from the risks they face."
      pages="pp. 27, 30–33"
    >
      <Panel title="CONSEQUENCES" note="five kinds">
        <p>
          When a PC suffers an effect from an enemy or a dangerous situation, it's called a consequence. Consequences are the companion to
          effects. The GM can inflict one or more, depending on the circumstances of the action roll and the position.
        </p>
        <Rows
          rows={[
            ['Reduced effect', 'Impaired performance. The action is not as effective as anticipated: the effect level drops by one after all other factors.'],
            ['Complication', 'Trouble, mounting danger, or a new threat. The GM introduces an immediate problem or ticks a clock: one tick minor, two standard, three for a serious complication.'],
            ['Lost opportunity', 'Shifting circumstance. You had a chance to achieve your goal with this action, but it slips away. To try again you need a new approach.'],
            ['Worse position', 'Losing control of the situation. The action carries you into a more dangerous position; you may try again at the worse position.'],
            ['Harm', 'A long-lasting debility, or death. Record the injury at the level of harm suffered: lesser (1), moderate (2), severe (3); fatal is level 4. See the harm grid.'],
          ]}
        />
        <Note>You can resist any consequence, or use armor against one, to reduce or avoid it. Only one resistance roll per consequence.</Note>
      </Panel>

      <Panel title="HARM" note="healing clock: 4 segments">
        <Table
          head={['Level', 'Row', 'Penalty', 'Examples']}
          rows={[
            [<span class="rf-num">4</span>, 'Fatal', <span class="rf-em">DEAD</span>, 'Electrocuted, Drowned, Stabbed in the Heart'],
            [<span class="rf-num">3</span>, 'Severe (1 cell)', 'NEED HELP', sheets.harmExamples['3']],
            [<span class="rf-num">2</span>, 'Moderate (2 cells)', '−1d', sheets.harmExamples['2']],
            [<span class="rf-num">1</span>, 'Lesser (2 cells)', 'REDUCED EFFECT', sheets.harmExamples['1']],
          ]}
        />
        <Rows
          rows={[
            ['Need help', 'Level 3 harm: incapacitated unless helped or pushing yourself.'],
            ['Cascading', 'If you need to mark a harm level, but the row is already filled, the harm moves up to the next row above. Overflow past level 3 is level 4.'],
            ['Penalties', 'Apply only when the harm is relevant to the situation; the player decides.'],
            [
              'Healing',
              'Recovery ticks the 4-segment healing clock like a project (1–3: one, 4/5: two, 6: three, critical: five). When you fill your healing clock, reduce each instance of harm on your sheet by one level, then clear the clock. Excess ticks roll over. Whenever you suffer new harm, clear any ticks on your healing clock.',
            ],
          ]}
        />
      </Panel>

      <Panel title="ARMOR" note="three boxes: armor, heavy, special">
        <p>
          Mark an armor box to reduce or avoid a consequence instead of rolling to resist. When an armor box is marked, it can't be used
          again until it's restored. All of your armor is restored during downtime.
        </p>
        <Rows
          rows={[
            ['Armor', 'Thick leather tunic, reinforced gloves and boots. 2 load. Usable when carried.'],
            ['+Heavy', 'Chain mail, plates, helm. +3 load in addition to armor (5 total). Usable when carried.'],
            [
              'Special',
              'Only usable with a special ability that references special armor (Battleborn, Focused, Fortitude, Shadow, Subterfuge, Mastermind, Warded). Without one you can\'t use that box at all.',
            ],
          ]}
        />
      </Panel>

      <Panel title="RESISTANCE ROLL" note="1d per attribute rating">
        <p>
          Roll the attribute the consequence falls under: <b>Insight</b> resists deception or understanding, <b>Prowess</b> physical strain or
          injury, <b>Resolve</b> mental strain or willpower. The consequence is reduced or avoided (GM chooses). Only one roll per consequence.
        </p>
        <Table
          head={['Highest die', '1', '2', '3', '4', '5', '6', 'Critical']}
          rows={[['Stress taken', '5', '4', '3', '2', '1', '0', 'clear 1']]}
        />
        <Note>You suffer 6 stress minus the highest die; a critical also clears 1 stress. Attribute rating = the number of that attribute's actions with at least one dot.</Note>
      </Panel>

      <Panel title="STRESS & TRAUMA" note="9 stress boxes, 4 trauma boxes">
        <p>
          Stress comes from pushing yourself (2 per benefit), assisting (1), leading a group action (1 per teammate who rolled 1 to 3),
          resisting (6 minus highest die), ignoring your vice (stress equal to trauma), and ability costs. The maximum number of stress boxes
          is 12.
        </p>
        <p>
          When the last box is marked, the character suffers <b>trauma</b> and is taken out of the scene; they return with zero stress and
          their vice satisfied for the next downtime. Trauma conditions are permanent. The fourth trauma retires the character (or sends
          them to prison to take the fall for the crew's wanted level).
        </p>
        <Label>Trauma conditions</Label>
        <Rows rows={sheets.trauma.map(([name, text]) => [name, text])} />
      </Panel>

      <Panel title="DEATH">
        <Rows
          rows={[
            ['Level 4 harm', 'Unresisted level 4 harm is fatal.'],
            ['Overflow', 'Harm needed at level 3 when that row is already full is catastrophic.'],
            ['Afterwards', 'On death the player may make a new scoundrel or transfer to the Ghost playbook.'],
          ]}
        />
        <Note>A resistance roll or an armor box can reduce fatal harm before it lands.</Note>
      </Panel>
    </RefSheet>
  );
}
