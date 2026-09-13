/** Sheet 1: the action roll procedure, dice pool and the results grid (core rulebook pp. 18 to 23). */
import { OUTCOMES, type Position } from '../../../ledger/rules';
import { Label, List, Note, Panel, RefSheet, Rows, Steps } from './bits';

const POSITIONS: { id: Position; name: string; line: string }[] = [
  { id: 'controlled', name: 'Controlled', line: 'You act on your terms. You exploit a dominant advantage.' },
  { id: 'risky', name: 'Risky', line: 'You go head to head. You act under fire. You take a chance.' },
  { id: 'desperate', name: 'Desperate', line: "You overreach your capabilities. You're in serious trouble." },
];

export function ActionRollSheet() {
  return (
    <RefSheet
      title="Action Roll"
      sub="When a player character does something challenging, we make an action roll to see how it turns out."
      pages="pp. 18–23"
    >
      <Panel title="THE SIX STEPS">
        <Steps
          items={[
            'The player states their goal for the action.',
            'The player chooses the action rating.',
            'The GM sets the position for the roll.',
            'The GM sets the effect level for the action.',
            'Add bonus dice.',
            'The player rolls the dice and we judge the result.',
          ]}
        />
        <Note>
          An action is challenging if there's an obstacle to the PC's goal that's dangerous or troublesome in some way. If their action is
          something that we'd expect them to simply accomplish, then we don't make an action roll.
        </Note>
      </Panel>

      <Panel title="THE DICE POOL" note="up to two bonus dice">
        <Rows
          rows={[
            ['1d', 'for each Action rating dot.'],
            [
              '+1d',
              <>
                if you <b>push yourself</b> (take 2 stress) <i>or</i> you accept a <b>Devil's Bargain</b>. You can't get dice for both, it's
                one or the other.
              </>,
            ],
            [
              '+1d',
              <>
                if you have <b>assistance</b>. A teammate takes 1 stress, says how they help you, and gives you +1d. Only one assist per roll.
              </>,
            ],
            ['0d', 'Roll 2d and keep the lowest. A zero-dice roll cannot be a critical.'],
          ]}
        />
        <Label>Read the highest die</Label>
        <Rows
          rows={[
            ['Critical', 'Two or more 6s.'],
            ['6', 'Full success.'],
            ['4/5', 'Partial success with a consequence.'],
            ['1–3', 'Bad outcome.'],
          ]}
        />
      </Panel>

      <Panel title="THE DEVIL'S BARGAIN">
        <p>The GM or any other player can offer you a bonus die if you accept a Devil's Bargain. Common Devil's Bargains include:</p>
        <List
          items={[
            'Collateral damage, unintended harm.',
            'Sacrifice coin or an item.',
            'Betray a friend or loved one.',
            'Offend or anger a faction.',
            'Start and/or tick a troublesome clock.',
            'Add heat to the crew from evidence or witnesses.',
            'Suffer harm.',
          ]}
        />
        <Note>
          The Devil's Bargain occurs regardless of the outcome of the roll. You make the deal, pay the price, and get the bonus die. The
          Devil's Bargain is always a free choice. If you don't like one, just reject it. You can always just push yourself for that bonus
          die instead.
        </Note>
      </Panel>

      <Panel title="RESULTS BY POSITION" wide note="the worse your position, the worse the consequences">
        <div class="rf-table-wrap">
          <table class="rf-table rf-outcomes">
            <thead>
              <tr>
                <th>Position</th>
                <th>Critical</th>
                <th>6</th>
                <th>4/5</th>
                <th>1–3</th>
              </tr>
            </thead>
            <tbody>
              {POSITIONS.map((p) => (
                <tr key={p.id}>
                  <td class="k">
                    <span class="rf-pos">{p.name}</span>
                    <span class="rf-pos-line">{p.line}</span>
                  </td>
                  <td>{OUTCOMES[p.id].crit}</td>
                  <td>{OUTCOMES[p.id].six}</td>
                  <td>{OUTCOMES[p.id].mid}</td>
                  <td>{OUTCOMES[p.id].low}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note>
          Each 4/5 and 1-3 outcome lists suggested consequences for the character. The GM can inflict one or more of these consequences,
          depending on the circumstances of the action roll. On a 1-3, it's up to the GM to decide if the PC's action has any effect or not,
          or if it even happens at all. PCs can avoid or reduce the severity of consequences by resisting them.
        </Note>
      </Panel>

      <Panel title="DOUBLE-DUTY ROLLS">
        <p>
          Since NPCs don't roll for their actions, an action roll does double-duty: it resolves the action of the PC as well as any NPCs
          that are involved.
        </p>
        <Rows
          rows={[
            ['6', 'The PC wins and has their effect.'],
            ['4/5', "It's a mix—both the PC and the NPC have their effect."],
            ['1–3', 'The NPC wins and has their effect as a consequence on the PC.'],
          ]}
        />
      </Panel>

      <Panel title="NARRATING THE RESULT">
        <p>
          When you narrate the action after the roll, the GM and player collaborate together to say what happens on-screen. The GM has
          final say over what happens and inflicts consequences as called for by the position and the result of the roll.
        </p>
        <Note>
          The GM's choices for effect level and position can be strongly influenced by the player's choice of action rating. The players
          are always free to choose the action they perform, but that doesn't mean all actions should be equally risky or potent.
        </Note>
      </Panel>
    </RefSheet>
  );
}
