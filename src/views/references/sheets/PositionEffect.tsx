/** Sheet 2: position, effect, the effect factors and the trade-off (core rulebook pp. 19 to 29). */
import { Label, Note, Panel, RefSheet, Rows, Table } from './bits';

export function PositionEffectSheet() {
  return (
    <RefSheet
      title="Position & Effect"
      sub="Position is how dangerous the action is; effect is how much it can accomplish. The GM sets both at once."
      pages="pp. 19–29"
    >
      <Panel title="POSITION" note="default: risky">
        <Rows
          rows={[
            ['Controlled', "You have a golden opportunity. You're exploiting a dominant advantage. You're set up for success."],
            ['Risky', "You go head to head. You're acting under duress. You're taking a chance."],
            ['Desperate', "You're in serious trouble. You're overreaching your capabilities. You're attempting a dangerous maneuver."],
          ]}
        />
        <Note>
          By default, an action roll is risky. You wouldn't be rolling if there was no risk involved. If the situation seems more dangerous,
          make it desperate. If it seems less dangerous, make it controlled. As GM, you have final say over the position for the roll, but
          explain and clarify things as needed.
        </Note>
      </Panel>

      <Panel title="EFFECT" note="default: standard">
        <Table
          head={['Level', 'Ticks', 'What it means']}
          rows={[
            [
              'Great',
              <span class="rf-num">3</span>,
              'You achieve more than usual. How does the extra effort manifest? What additional benefit do you enjoy?',
            ],
            [
              'Standard',
              <span class="rf-num">2</span>,
              'You achieve what we’d expect as “normal” with this action. Is that enough, or is there more left to do?',
            ],
            [
              'Limited',
              <span class="rf-num">1</span>,
              'You achieve a partial or weak effect. How is your impact diminished? What effort remains to achieve your goal?',
            ],
          ]}
        />
        <Note>
          When considering factors, effect level might be reduced below limited, resulting in zero effect—or increased beyond great,
          resulting in an extreme effect. If a special ability gives “+1 effect,” it comes into play after the GM has assessed the effect
          level. A PC can also push themselves (take 2 stress) to get +1 effect on their action.
        </Note>
      </Panel>

      <Panel title="EFFECT FACTORS" note="advantage: higher effect. disadvantage: lower.">
        <p>
          To assess effect level, first start with your gut feeling, given this situation. Then, if needed, assess three factors that may
          modify the effect level.
        </p>
        <Rows
          rows={[
            [
              'Potency',
              'Particular weaknesses, taking extra time or a bigger risk, enhanced effort from pushing yourself, or the influence of arcane powers. The electrical discharge of a lightning hook is potent against a ghost.',
            ],
            [
              'Quality / Tier',
              'The effectiveness of tools, weapons, or other resources, usually summarized by Tier. Fine items count as +1 bonus in quality, stacking with Tier.',
            ],
            [
              'Scale',
              'The number of opponents, size of an area covered, scope of influence, etc. Larger scale can be an advantage or disadvantage depending on the situation. In battle, more people are better. When infiltrating, more people are a hindrance.',
            ],
          ]}
        />
        <Label>Dominant factors</Label>
        <p>
          If one effect factor overshadows the others, the side with that advantage dominates the situation. It doesn’t matter if you have
          a fine sword and extra effect if you try to fight 20 people at once. Their scale dominates the battle and you’re left with very
          limited effect, or no effect at all. The same principle applies to “impossible” actions.
        </p>
      </Panel>

      <Panel title="TRADING POSITION FOR EFFECT">
        <p>
          After factors are considered and the GM has announced the effect level, a player might want to trade position for effect, or vice
          versa. For instance, if they're going to make a risky roll with standard effect (the most common scenario, generally), they might
          instead want to push their luck and make a desperate roll but with great effect.
        </p>
        <Note>
          This kind of trade-off isn't included in the effect factors because it's not an element the GM should assess when setting the
          effect level. Once the level is set, though, you can always offer the trade-off to the player if it makes sense in the situation.
        </Note>
      </Panel>

      <Panel title="SETTING POSITION & EFFECT" wide note="nine combinations">
        <p>
          The GM sets position and effect for an action roll at the same time, after the player says what they're doing and chooses their
          action. Usually, <b>Risky / Standard</b> is the default combination, modified by the action being used, the strength of the
          opposition, and the effect factors.
        </p>
        <Label>Example: a scoundrel facing off alone against a small enemy gang</Label>
        <Table
          head={['She...', 'Why', 'Position / Effect']}
          rows={[
            [
              'Fights the gang straight up, rushing into their midst',
              'Being threatened by the larger force lowers her position; the scale of the gang reduces her effect.',
              <b>Desperate / Limited</b>,
            ],
            [
              'Fights from a choke-point, like a narrow alleyway',
              "Not threatened by several at once, so her risk is similar to a one-on-one fight, but there's still a lot of enemies to deal with.",
              <b>Risky / Limited</b>,
            ],
            [
              "Doesn't fight, instead maneuvers past them and escapes",
              "Still under threat from many enemy attacks, but if the ground is open and the gang can't easily corral her, her effect for escaping isn't reduced. With an immediate means of escape (leaping onto a speeding carriage) her effect might even be increased.",
              <>
                <b>Desperate / Standard</b>
                <br />
                <b>Desperate / Great</b>
              </>,
            ],
            [
              'Takes a shot from an unnoticed sniper position on a nearby roof',
              "Their greater numbers aren't a factor, and she's not immediately in any danger. Suppressing fire against the whole gang: their scale applies. If the gang is on guard, her position is more dangerous. If alerted to a sniper, effect drops as they scatter and take cover. If they muster covering fire while falling back, things are even worse.",
              <>
                <b>Controlled / Great</b>
                <br />
                <b>Controlled / Limited</b>
                <br />
                <b>Risky / Great</b>
                <br />
                <b>Risky / Limited</b>
                <br />
                <b>Desperate / Limited</b>
              </>,
            ],
          ]}
        />
      </Panel>

      <Panel title="EFFECTS IN THE FICTION">
        <p>
          For a simple action, the effect level determines the end result. Do you achieve your goal partially, fully, or with great effect?
          For a more complex obstacle, the GM creates a progress clock to track the effort made to overcome it. You tick a number of segments
          on the clock depending on the effect level of your action and the factors involved. When you fill the clock, the obstacle is
          overcome.
        </p>
        <Note>There’s no hard and fast rule for what’s “simple” or “complex.” Go with your gut, moment to moment in play.</Note>
      </Panel>
    </RefSheet>
  );
}
