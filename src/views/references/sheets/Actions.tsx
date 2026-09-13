/**
 * Sheet 8: the twelve actions by attribute (one-liners from the bundled sheet data, pp. 58 to 59)
 * and gathering information (pp. 36 to 37).
 */
import { ACTIONS_BY_ATTRIBUTE, ATTRIBUTES, sheets, type AttributeId } from '../../../data';
import { List, Note, Panel, RefSheet, Rows, Table } from './bits';

const RESISTS: Record<AttributeId, string> = {
  insight: 'resists deception or understanding',
  prowess: 'resists physical strain or injury',
  resolve: 'resists mental strain or willpower',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const QUESTIONS = [
  "What's really going on here?",
  'What are they really feeling?',
  'What do they intend to do?',
  'How can I find [X]?',
  'Where did the package end up?',
  'How can I discover leverage to manipulate them?',
  "What's a good point of infiltration?",
  "What's the danger here?",
  'Are they about to attack us?',
  'How can I get them to trust me?',
  'Have any new ghosts been here?',
  'What should I be worried about?',
];

export function ActionsSheet() {
  return (
    <RefSheet
      title="The Twelve Actions & Gathering Information"
      sub="Roll the action your character is presently performing in the fiction. An attribute rating is the number of its actions with at least one dot."
      pages="pp. 36–37, 58–59"
    >
      {ATTRIBUTES.map((attr) => (
        <Panel key={attr} title={attr.toUpperCase()} note={RESISTS[attr]}>
          <Rows rows={ACTIONS_BY_ATTRIBUTE[attr].map((a) => [cap(a), `${cap(sheets.actionDesc[a])}.`])} />
        </Panel>
      ))}

      <Panel title="CHOOSING AN ACTION" wide>
        <p>
          The player chooses which action rating to roll, following from what their character is doing on-screen. If you want to roll your
          Skirmish action, then get in a fight. If you want to roll your Command action, then order someone around. You can't roll a given
          action rating unless your character is presently performing that action in the fiction.
        </p>
        <Note>
          There's definitely some gray area here, where actions overlap and goals can be attempted with a variety of approaches. If your
          goal is to hurt someone with violence, you might Skirmish or Hunt or Prowl or Wreck, depending on the situation at hand. If your
          goal is to dismay and frighten an enemy, you might Command or Sway or Wreck. It's the player's choice.
        </Note>
        <Rows
          rows={[
            ['Rating', 'Each action has four dots; roll 1d per dot. Zero dots: roll 2d and keep the lowest.'],
            ['Attribute', 'Equal to the number of actions under it with at least one dot. This is the pool for resistance rolls.'],
            ['Caps', 'Two dots per action at creation; three after; four with the crew’s Mastery upgrade.'],
          ]}
        />
      </Panel>

      <Panel title="GATHER INFORMATION" note="effect sets the detail">
        <Table
          head={['Effect', 'You learn']}
          rows={[
            ['Limited', 'Incomplete information.'],
            ['Standard', 'Good details; follow-up questions are possible.'],
            ['Great', 'Exceptional, complete information.'],
          ]}
        />
        <Note>
          If you don’t know a plan’s detail, you can gather information in some way to discover it. In your crew’s hunting grounds you get
          +1d to gather information.
        </Note>
      </Panel>

      <Panel title="EXAMPLE QUESTIONS" note="some are on the bottom of the character sheet">
        <List items={QUESTIONS} />
      </Panel>
    </RefSheet>
  );
}
