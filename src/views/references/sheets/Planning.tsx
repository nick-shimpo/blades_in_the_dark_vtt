/** Sheet 5: plans, the engagement roll, loadout and flashbacks (core rulebook pp. 127 to 133; load thresholds from the bundled sheet data). */
import { sheets } from '../../../data';
import { Label, List, Note, Panel, RefSheet, Rows, Table } from './bits';

export function PlanningSheet() {
  return (
    <RefSheet
      title="Planning & Engagement"
      sub="Choose a plan, supply its detail, pick your load, and the engagement roll cuts straight to the first obstacle."
      pages="pp. 127–133"
    >
      <Panel title="THE SIX PLANS" wide note="choose the plan and supply the detail">
        <Table
          head={['Plan', 'What it is', 'Detail']}
          rows={[
            ['Assault', 'Do violence to a target.', 'The point of attack.'],
            ['Deception', 'Lure, trick, or manipulate.', 'The method of deception.'],
            ['Stealth', 'Trespass unseen.', 'The point of infiltration.'],
            ['Occult', 'Engage a supernatural power.', 'The arcane method.'],
            ['Social', 'Negotiate, bargain, or persuade.', 'The social connection.'],
            ['Transport', 'Carry cargo or people through danger.', 'The route & means.'],
          ]}
        />
        <Note>
          You, the players, don’t have to do the nitty-gritty planning. The characters take care of that, off-screen. If you don’t know the
          detail, you can gather information in some way to discover it. Then the GM will cut to the action as the first moments of the
          operation unfold.
        </Note>
      </Panel>

      <Panel title="ENGAGEMENT ROLL" note="a fortune roll">
        <Rows
          rows={[
            ['1d', 'for sheer luck.'],
            ['+1d', 'for each Major Advantage.'],
            ['−1d', 'for each Major Disadvantage.'],
          ]}
        />
        <Label>Outcome: the position when the action starts</Label>
        <Rows
          rows={[
            ['Critical', 'Exceptional result. You’ve already overcome the first obstacle and you’re in a controlled position for what’s next.'],
            ['6', 'Good result. You’re in a controlled position when the action starts.'],
            ['4/5', 'Mixed result. You’re in a risky position when the action starts.'],
            ['1–3', 'Bad result. You’re in a desperate position when the action starts.'],
          ]}
        />
        <Note>
          Once the initial actions have been resolved, you follow the normal process for establishing position for the rest of the rolls
          during the score. A desperate position is the worst thing that can result from the plan + detail + engagement process.
        </Note>
      </Panel>

      <Panel title="MAJOR ADVANTAGES / DISADVANTAGES">
        <List
          items={[
            <>
              Is this operation particularly bold or daring? <b>+1d</b>. Is this operation overly complex or contingent on many factors?{' '}
              <b>−1d</b>.
            </>,
            <>
              Does the plan's detail expose a vulnerability of the target or hit them where they're weakest? <b>+1d</b>. Is the target
              strongest against this approach, or do they have particular defenses or special preparations? <b>−1d</b>.
            </>,
            <>
              Can any of your friends or contacts provide aid or insight for this operation? <b>+1d</b>. Are any enemies or rivals
              interfering in the operation? <b>−1d</b>.
            </>,
            <>
              Are there any other elements that you want to consider? Maybe a lower-Tier target will give you <b>+1d</b>. Maybe a higher-Tier
              target will give you <b>−1d</b>. Maybe there's a situation in the district that makes the operation more or less tricky.
            </>,
          ]}
        />
        <Note>
          Don’t make the engagement roll and then describe the PCs approaching the target. It’s the approach that the engagement roll
          resolves. Cut to the first serious obstacle in their path.
        </Note>
      </Panel>

      <Panel title="LOADOUT" note={`max ${sheets.load.max}`}>
        <p>
          After the plan and detail are in place, each player chooses their character’s load. They don’t have to select individual
          items—just the maximum amount they’ll have access to during the action.
        </p>
        <Table
          head={['Load', 'Items', 'Meaning']}
          rows={[
            ['Light', `1–${sheets.load.light}`, 'Faster, less conspicuous; you blend in with citizens.'],
            ['Normal', `${sheets.load.light + 1}–${sheets.load.normal}`, 'You look like a scoundrel.'],
            ['Heavy', `${sheets.load.heavy}`, 'Slower; you look like an operative.'],
          ]}
        />
        <Note>
          Maximum load is heavy plus 2. Some items count as two items for load (they have two connected boxes). Items in italics don’t
          count toward your load. One unit of coin carried takes one load. The Cutter’s Mule ability raises the thresholds to 5, 7 and 8.
        </Note>
      </Panel>

      <Panel title="FLASHBACKS" note="the GM sets a stress cost">
        <p>
          The rules don’t distinguish between actions performed in the present moment and those performed in the past. When an operation is
          underway, you can invoke a flashback to roll for an action in the past that impacts your current situation.
        </p>
        <Rows
          rows={[
            [<span class="rf-num">0</span>, 'An ordinary action for which you had easy opportunity.'],
            [<span class="rf-num">1</span>, 'A complex action or unlikely opportunity.'],
            [<span class="rf-num">2+</span>, 'An elaborate action that involved special opportunities or contingencies.'],
          ]}
        />
        <Note>
          After the stress cost is paid, a flashback action is handled just like any other action: sometimes an action roll, sometimes a
          fortune roll, sometimes no roll at all. If a flashback involves a downtime activity, pay 1 coin or 1 rep for it, instead of
          stress. A flashback isn’t time travel. It can’t “undo” something that just occurred in the present moment.
        </Note>
      </Panel>

      <Panel title="LINKED PLANS & GIVING UP">
        <Rows
          rows={[
            [
              'Setup maneuver',
              'The diversion is a setup maneuver a team member performs as part of the plan. Success can improve position for teammates (possibly offsetting a bad engagement roll) or give increased effect; failure might give the engagement roll −1d.',
            ],
            [
              'Separate plan',
              'The diversion is its own plan, engagement, and operation whose outcome creates the opportunity for a future plan. You go into downtime (payoff, heat, etc.) after the first part, as normal.',
            ],
            [
              'Giving up',
              'When you give up on a score, you go into downtime. You’ll usually have zero payoff, since you didn’t accomplish anything. You’ll still face heat and entanglements as usual.',
            ],
          ]}
        />
      </Panel>
    </RefSheet>
  );
}
