/**
 * Sheet 6: payoff, heat, wanted level, entanglements, downtime activities, vice, recovery and
 * incarceration (core rulebook pp. 145 to 159; entanglement text pp. 150 to 152).
 */
import { Label, Note, Panel, RefSheet, Rows, Table } from './bits';

const ENTANGLEMENTS: [string, string][] = [
  [
    'Arrest',
    'An Inspector presents a case file of evidence to a magistrate, to begin prosecution of your crew. The Bluecoats send a detail to arrest you (a gang at least equal in scale to your wanted level). Pay them off with coin equal to your wanted level +3, hand someone over for arrest (this clears your heat), or try to evade capture.',
  ],
  [
    'Cooperation',
    "A +3 status faction asks you for a favor. Agree to do it, or forfeit 1 rep per Tier of the friendly faction, or lose 1 status with them. If you don't have a +3 faction status, you avoid entanglements right now.",
  ],
  ['Demonic Notice', 'A demon approaches the crew with a dark offer. Accept their bargain, hide until it loses interest (forfeit 3 rep), or deal with it another way.'],
  [
    'Flipped',
    "One of the PC's rivals arranges for one of your contacts, patrons, clients, or a group of your customers to switch allegiances due to the heat on you. They're loyal to another faction now.",
  ],
  [
    'Gang Trouble',
    'One of your gangs (or other cohorts) causes trouble due to their flaw(s). You can lose face (forfeit rep equal to your Tier +1), make an example of one of the gang members, or face reprisals from the wronged party.',
  ],
  [
    'Interrogation',
    "The Bluecoats round up one of the PCs to question them about the crew's crimes. How did they manage to capture you? Either pay them off with 3 coin, or they beat you up (level 2 harm) and you tell them what they want to know (+3 heat). You can resist each of those consequences separately.",
  ],
  [
    'Questioning',
    "The Bluecoats grab an NPC member of your crew or one of the crew's contacts, to question them about your crimes. Who do the Bluecoats think is most vulnerable? Make a fortune roll to see how much they talk (1-3: +2 heat, 4/5: +1 heat), or pay the Bluecoats off with 2 coin.",
  ],
  [
    'Reprisals',
    "An enemy faction makes a move against you (or a friend, contact, or vice purveyor). Pay them (1 rep and 1 coin) per Tier of the enemy as an apology, allow them to mess with you or yours, or fight back and show them who's boss.",
  ],
  [
    'Rivals',
    'A neutral faction throws their weight around. They threaten you, a friend, a contact, or one of your vice purveyors. Forfeit (1 rep or 1 coin) per Tier of the rival, or stand up to them and lose 1 status with them.',
  ],
  [
    'Show of Force',
    'A faction with whom you have a negative status makes a play against your holdings. Give them 1 claim or go to war (drop to -3 status). If you have no claims, lose 1 hold instead.',
  ],
  [
    'Unquiet Dead',
    "A rogue spirit is drawn to you—perhaps it's a past victim? Acquire the services of a Whisper or Rail Jack to attempt to destroy or banish it, or deal with it yourself.",
  ],
  [
    'The Usual Suspects',
    'The Bluecoats grab someone in the periphery of your crew. One player volunteers a friend or vice purveyor as the person most likely to be taken. Make a fortune roll to find out if they resist questioning (1-3: +2 heat, 4/5: level 2 harm), or pay the Bluecoats off with 1 coin.',
  ],
];

export function DowntimeSheet() {
  return (
    <RefSheet
      title="Downtime"
      sub="After the score: payoff, heat, an entanglement, then two downtime activities each, and indulge your vice."
      pages="pp. 145–159"
    >
      <Panel title="PAYOFF" note="coin by score">
        <Table
          head={['Score', 'Coin']}
          rows={[
            ['Minor', '2'],
            ['Small', '4'],
            ['Standard', '6'],
            ['Big', '8'],
            ['Major', '10+'],
          ]}
        />
        <Rows
          rows={[
            ['Tithe', 'If you work for a boss, tithe coin equal to Tier +1.'],
            ['Rep', 'Rep earned per score equals the target’s Tier; zero if kept completely quiet.'],
            ['Coin', 'Recorded on the crew sheet or divvied among PCs. More than 4 coin on a scoundrel goes to stash; 2 stash buys 1 coin back.'],
          ]}
        />
        <Label>What coin is worth</Label>
        <Rows
          rows={[
            ['1', 'a month’s wages'],
            ['2', 'a fine weapon or luxury clothes'],
            ['4', 'an exquisite jewel'],
            ['6', 'a small safe of valuables'],
            ['8', 'liquidating a carriage or a deed'],
            ['10', 'a treasure trove'],
          ]}
        />
      </Panel>

      <Panel title="HEAT & WANTED LEVEL" note="heat track 9, wanted max 4">
        <Table
          head={['The score was...', 'Heat']}
          rows={[
            ['Smooth and quiet', '0'],
            ['Contained', '2'],
            ['Loud and chaotic', '4'],
            ['Wild', '6'],
          ]}
        />
        <Rows
          rows={[
            ['+1', 'high-profile target'],
            ['+1', 'on hostile turf'],
            ['+1', 'the crew is at war'],
            ['+2', 'killing was involved'],
          ]}
        />
        <Note>
          When your heat level reaches 9, you gain a wanted level and clear your heat (any excess heat rolls over). The maximum wanted level
          is 4. Wanted level drops only through incarceration of a crew member, friend, contact or framed enemy: −1 wanted level and clear
          heat.
        </Note>
      </Panel>

      <Panel title="ENTANGLEMENTS" wide note="roll wanted level dice; wanted 0 rolls 2d and keeps the lowest">
        <p>
          After payoff and heat are determined, the GM generates an entanglement for the crew. Find the column that matches the crew’s
          current heat level. Then roll a number of dice equal to their wanted level, and use the result of the roll to select which sort of
          entanglement manifests.
        </p>
        <Table
          head={['Roll', 'Heat 0–3', 'Heat 4/5', 'Heat 6+']}
          rows={[
            ['1–3', 'Gang Trouble or The Usual Suspects', 'Gang Trouble or Questioning', 'Flipped or Interrogation'],
            ['4/5', 'Rivals or Unquiet Dead', 'Reprisals or Unquiet Dead', 'Demonic Notice or Show of Force'],
            ['6', 'Cooperation', 'Show of Force', 'Arrest'],
          ]}
        />
        <Note>
          Entanglements manifest fully before the PCs have a chance to avoid them. Bring the entanglement into play immediately, or hold off
          until an appropriate moment.
        </Note>
        <div class="rf-two-col">
          <Rows rows={ENTANGLEMENTS.slice(0, 6)} />
          <Rows rows={ENTANGLEMENTS.slice(6)} />
        </div>
      </Panel>

      <Panel title="DOWNTIME ACTIVITIES" wide note="two free per PC (one at war); extras cost 1 coin or 1 rep">
        <Table
          head={['Activity', 'Roll', 'Result']}
          rows={[
            ['Acquire asset', 'Crew Tier', 'Quality: 1–3 Tier −1; 4/5 Tier; 6 Tier +1; critical Tier +2. +1d if acquired before.'],
            ['Long-term project', 'An action', 'Clock ticks: 1–3 one; 4/5 two; 6 three; critical five. Clocks are usually 4, 6 or 8 segments.'],
            ['Recover', 'Healer’s Tinker or NPC quality', 'Healing clock ticks as above.'],
            ['Reduce heat', 'An action', 'Clear heat: 1–3 one; 4/5 two; 6 three; critical five.'],
            ['Train', 'none', 'Mark 1 xp in an attribute or playbook track (2 with the crew Training upgrade); once per track per downtime.'],
            ['Indulge vice', 'Lowest attribute', 'Clear stress equal to the highest die.'],
          ]}
        />
        <Note>After any downtime roll, spend coin to raise the result one level per coin. Armor is restored at downtime.</Note>
      </Panel>

      <Panel title="VICE" note="roll your lowest attribute">
        <p>
          Clear stress equal to the highest die. If you clear more stress than you had marked, you <b>overindulge</b>; choose one:
        </p>
        <Rows
          rows={[
            ['Attract Trouble', 'An extra entanglement.'],
            ['Brag', '+2 heat.'],
            ['Lost', 'Vanish for weeks; play another character; harm heals.'],
            ['Tapped', 'Your purveyor cuts you off; find a new one.'],
          ]}
        />
        <Note>Not indulging costs stress equal to your trauma count.</Note>
      </Panel>

      <Panel title="RECOVERY" note="healing clock: 4 segments">
        <Rows
          rows={[
            ['Healer', 'Rolls Tinker (Physicker) or an NPC’s quality. Ticks: 1–3 one, 4/5 two, 6 three, critical five.'],
            ['Self-treatment', 'With Physicker: 2 stress. Toughing it out: 1 stress and roll 0d.'],
            ['Full clock', 'Reduce each instance of harm on your sheet by one level, then clear the clock. Excess ticks roll over.'],
            ['New harm', 'Clears any ticks on your healing clock.'],
          ]}
        />
      </Panel>

      <Panel title="INCARCERATION" note="−1 wanted level, clear heat">
        <Table
          head={['Wanted', 'Sentence']}
          rows={[
            ['4', 'Life or execution'],
            ['3', 'A year or two'],
            ['2', 'Several months'],
            ['1', 'A month or two'],
            ['0', 'A few weeks or a beating (level 3 harm, no resistance)'],
          ]}
        />
        <Label>Incarceration roll: 1d per crew Tier</Label>
        <Rows
          rows={[
            ['Critical', '+3 rep, a prison claim, +1 status with a faction helped inside.'],
            ['6', 'A prison claim and +1 status.'],
            ['4/5', 'Uneventful.'],
            ['1–3', 'A level of trauma.'],
          ]}
        />
      </Panel>
    </RefSheet>
  );
}
