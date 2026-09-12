/**
 * Play — moment-of-play procedure reference. Static cards transcribed from the
 * prototype's `showPlay` block; nothing here reads or writes the ledger.
 */
import './play.css';

const STEPS = ['GOAL', 'RISK', 'POSITION', 'EFFECT', 'CONSEQUENCES'];
const CONSEQUENCES = ['harm', 'lost position', 'reduced effect', 'lost opportunity', 'new threat', 'clock', 'separation', 'resource loss', 'heat', 'faction reaction', 'info revealed', 'complication'];
const AGENCY = ['attack', 'negotiate', 'ally', 'betray', 'evade', 'exploit', 'escalate', 'walk away'];

export function PlayView() {
  return (
    <main class="play">
      <div class="play-inner">
        <div class="play-hero">
          <div class="hero-head">
            <div class="hero-title">Action Roll</div>
            <div class="flow">
              {STEPS.map((s) => (
                <span key={s} class="flow-pair">
                  <span class="step">{s}</span>
                  <span class="arr">→</span>
                </span>
              ))}
              <span class="step red">ROLL</span>
            </div>
            <div class="spacer" />
            <div class="hero-note">state the danger before the dice</div>
          </div>
          <div class="hero-grid">
            <div class="bullets">
              <div>· No meaningful risk → no Action Roll.</div>
              <div>· Uncertain but not risky → Fortune Roll.</div>
              <div>
                · Consequences named <b>before</b> the roll, never invented after.
              </div>
              <div>· Be firm about Position &amp; Effect. Let Load matter.</div>
              <div>· Let them spend resources for Effect.</div>
              <div>· Don't soften the fiction to protect them.</div>
            </div>
            <div class="positions">
              <div class="pos">
                <b>CONTROLLED</b>
                <span>your terms, dominant advantage</span>
              </div>
              <div class="pos">
                <b>RISKY</b>
                <span>head to head, under fire</span>
              </div>
              <div class="pos">
                <b>DESPERATE</b>
                <span>overreaching, serious trouble</span>
              </div>
              <div class="effect">Effect: limited · standard · great</div>
            </div>
            <div class="conseq">
              <div class="eyebrow">CONSEQUENCES — VARY THEM</div>
              <div class="tags">
                {CONSEQUENCES.map((c) => (
                  <span key={c} class="tag">
                    {c}
                  </span>
                ))}
              </div>
              <div class="warn">Level 1 Harm is not the default.</div>
            </div>
          </div>
        </div>

        <div class="play-grid">
          <div class="play-card">
            <div class="card-title">Free Play</div>
            <div class="card-sub">purpose: discover the next score</div>
            <div class="bullets">
              <div>· Follow contacts, goals, pressures, consequences.</div>
              <div>· No predetermined score. Ask what each PC wants.</div>
              <div>· Put opportunities in front of them.</div>
              <div>· Tie PC goals to faction pressure.</div>
              <div>· Narrow arena. Choices, not side-plots.</div>
            </div>
            <div class="ask">
              <div class="eyebrow">WHEN NOTHING IS HAPPENING, ASK</div>
              <div class="q">What do you want long-term? · Why are you here? · What are you building? · Who do you need? · What would hurt you? · What would make you leave the crew?</div>
              <div class="after">…answered in the fiction, in the den.</div>
            </div>
          </div>

          <div class="play-card">
            <div class="card-title">Score Setup</div>
            <div class="card-sub">make the score matter</div>
            <div class="bullets">
              <div>· Who is the target? Why now? Why care?</div>
              <div>· Which faction / story does it touch?</div>
              <div>· What might they discover? What could change?</div>
              <div>· No scene sequence. Players choose the approach.</div>
            </div>
            <div class="banner spaced">SITUATION → NPCS → PRESSURES → CLOCKS → OPPORTUNITIES</div>
          </div>

          <div class="play-card">
            <div class="card-title">Devil's Bargain</div>
            <div class="card-sub">optional — always</div>
            <div class="bullets">
              <div>· There doesn't need to be one.</div>
              <div>· Never manufactured just for dice.</div>
              <div>· Generic harm only if truly thematic.</div>
              <div>· Prefer bargains that change the fiction or seed future trouble.</div>
            </div>
            <div class="motto">Interesting &gt; available.</div>
          </div>

          <div class="play-card">
            <div class="card-title">Score Flow</div>
            <div class="card-sub">success resolves the obstacle — the world remembers</div>
            <div class="bullets">
              <div>· Let mechanics work; let success succeed.</div>
              <div>· Never secretly invalidate a roll later.</div>
              <div>
                · But: notice what actions <i>mean</i>.
              </div>
              <div>· Signpost repercussions. Remember witnesses.</div>
              <div>· Ask who will care. Bring fallout back later.</div>
            </div>
            <div class="banner">MECHANICAL SUCCESS ≠ FICTIONAL AMNESIA</div>
          </div>

          <div class="play-card">
            <div class="card-title">Clocks</div>
            <div class="card-sub">a clock is a live threat, not decoration</div>
            <div class="bullets">
              <div>· Give it a reason to tick.</div>
              <div>· Tick it through fiction — don't wait for failed rolls.</div>
              <div>· Keep progress visible; let it press.</div>
              <div>· Resolve it when it fills.</div>
            </div>
            <div class="banner">START → KEEP ALIVE → MAKE IT MATTER</div>
          </div>

          <div class="play-card">
            <div class="card-title">Downtime</div>
            <div class="card-sub">downtime decides what comes next</div>
            <div class="bullets">
              <div>· Advance consequences and faction moves.</div>
              <div>· Follow character goals; let relationships grow.</div>
              <div>· Surface opportunities. Introduce pressure.</div>
              <div>· Ask what the crew wants next.</div>
              <div>· Slice-of-life scenes make them people.</div>
            </div>
          </div>

          <div class="play-card">
            <div class="card-title">Between Sessions</div>
            <div class="card-sub">run the world, not the whole city</div>
            <div class="bullets">
              <div>
                · After 1–2 sessions, pick <b>2–3 featured factions</b>.
              </div>
              <div>· Track: their clocks · goals · reaction to the crew · next move · what they know.</div>
              <div>· Others exist without screen time.</div>
            </div>
            <div class="banner red">SEASON, NOT ENCYCLOPEDIA</div>
          </div>

          <div class="play-card">
            <div class="card-title">Campaign Direction</div>
            <div class="card-sub">narrow arena, wide agency</div>
            <div class="bullets">
              <div>· You control the arena: the crew + one central conflict (+ maybe one faction).</div>
              <div>· Inside it, players decide everything:</div>
            </div>
            <div class="tags agency">
              {AGENCY.map((a) => (
                <span key={a} class="tag">
                  {a}
                </span>
              ))}
            </div>
            <div class="arcs">
              <div>
                <b>BIG BANG</b> — early major move → retaliation → the season's conflict.
              </div>
              <div>
                <b>SLOW BURN</b> — careful build → attention → someone decides you matter.
              </div>
              <div class="arcs-note">Force neither. Discover the antagonist from player behaviour. No plot — pressure and consequences that create choices.</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
