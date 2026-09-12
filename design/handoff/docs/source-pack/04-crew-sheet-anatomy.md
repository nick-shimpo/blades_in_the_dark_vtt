# Crew sheet anatomy

Every region of the crew sheet, its box counts and the rules that drive it. Page numbers are the book's printed pages. "There is a separate character sheet for the crew, tracking its development, growth, and influence" (p. 91). Per-crew content (abilities, upgrades, claims, contacts) is in `05-crew-types.md`; the claims grids are also machine-readable in `07-claims-maps.json`.

---

## 1. Identity band

| Field | Type | Rules | Source |
|---|---|---|---|
| Crew name | text | | p. 92 |
| Crew type | one of six | Assassins, Bravos, Cult, Hawkers, Shadows, Smugglers | p. 92 |
| Reputation | one of eight, or custom | Ambitious, Brutal, Daring, Honorable, Professional, Savvy, Subtle, Strange | p. 93 |
| Lair | text plus district | Six sample lairs (half-sunken grotto in the underground canals, abandoned watch tower, back rooms of a merchant's shop, small abandoned house at the end of a dark lane, tin-roofed rooftop shack, junked rail-car). District from the map, Crow's Foot suggested. | p. 93 |
| Hunting grounds | district plus one preferred operation type | Three or four blocks. Each crew has four operation types; Cult calls this **sacred sites**, Hawkers **sales territory**, Smugglers **cargo types**. Benefit: +1d to gather information and a free extra downtime activity when preparing that operation type there. | p. 93 |

## 2. Rep and turf

- **Rep tracker: 12 boxes.** "You need 12 rep to fill the rep tracker on your crew sheet." (p. 44).
- **Turf is marked on the same tracker from the right-hand end**, capping the rep needed: "Each piece of turf that you claim represents abstracted support for the crew... Each piece of turf you hold reduces the rep cost to develop by one... You can hold a maximum of 6 turf. When you develop and reset your rep, you keep the marks from all the turf you hold." (p. 45). The book's illustration shows 9 rep boxes and 3 turf boxes filled from the right, labelled REP and TURF.
- Rep earned per score equals the target's Tier; zero if kept completely quiet (p. 44). Some abilities alter this (No Traces, Leverage, Victim Trophies claim).
- Bravos' Fiends counts wanted levels as turf and Hawkers' Accord counts +3 statuses as turf; "the minimum rep cost to advance your Tier is always 6" (p. 106, p. 114).

## 3. Tier and hold

- Crew begins at **Tier 0** with **weak hold** and 0 rep (p. 92). The sheet shows Tier as boxes 0 to IV **[sheet]**; factions in the setting run to VI.
- **Hold:** weak or strong (W or S).
- When the rep tracker fills (p. 44): if hold is weak, it becomes strong and rep resets; if hold is strong, the crew may pay **coin equal to new Tier times 8** to go up a Tier, then rep resets and hold drops to weak. "As long as your rep tracker is full, you don't earn new rep." Patron abilities halve the coin cost; the Hardcase prison claim reduces it by 2.
- Losing hold: an enemy operation can drop hold one step; weak hold dropping loses a Tier. At war the crew temporarily loses 1 hold. A Tier 0 weak-hold crew that loses hold has its lair threatened (p. 45).
- Tier drives gang scale and quality, item quality, acquire-asset rolls and the incarceration roll (p. 44). Gang scale by tier: 0 is 1 or 2 people, I small (3 to 6), II medium (12), III large (20), IV huge (40), V massive (80).

## 4. Heat and wanted level

- **Heat track: 9 boxes.** Per score: 0 smooth and quiet, 2 contained, 4 loud and chaotic, 6 wild. +1 for a high-profile target, +1 on hostile turf, +1 if at war, +2 if killing was involved (p. 147).
- **Wanted level: 4 boxes.** "When your heat level reaches 9, you gain a wanted level and clear your heat (any excess heat rolls over...)" (p. 148). "The maximum wanted level is 4." (p. 106).
- Wanted level drops only through incarceration of a crew member, friend, contact or framed enemy: -1 wanted level and clear heat (p. 148). Sentence length by wanted level and the incarceration roll are in `06-supporting-rules.md` section 11.
- Reducing heat is a downtime activity (1 to 3: one, 4/5: two, 6: three, critical: five), with several claims and abilities modifying it.

## 5. Coin (crew treasury)

- **4 boxes** by default: "A crew can also store 4 coin in their lair, by default." (p. 42).
- **Vault** upgrade: "increasing your storage capacity for coin to 8. A second upgrade increases your capacity to 16." (p. 95). Note the book contradicts itself: p. 42 says "8 and then 12". The crew-upgrades page (16) is the more specific rule and matches the Roll20 reproduction; flagged for Nick.
- Crew begins with 2 coin (p. 92). Payoff amounts are in `06-supporting-rules.md` section 10.

## 6. Crew XP and triggers

- **Crew XP track: 8 boxes [sheet, Roll20 reproduction; confirm against the official crew sheet].**
- End-of-session triggers, 1 xp each or 2 if it occurred multiple times or in a major way (p. 49):
  1. The crew-specific trigger (per crew in `05-crew-types.md`).
  2. "Contend with challenges above your current station."
  3. "Bolster your crew's reputation or develop a new one."
  4. "Express the goals, drives, inner conflict, or essential nature of the crew."
- On fill: "clear the marks and take a new special ability or mark two crew upgrade boxes." Then **profits**: "each PC gets +1 stash (+2 per crew Tier)" (p. 49).

## 7. Special abilities

- Grey column, seven per crew type; one chosen at creation ("If you can't decide which one to pick, go with the first one on the list", p. 94). Full text in `05-crew-types.md`.
- Several add state: Fiends (wanted as turf), Accord (statuses as turf), The Good Stuff (product quality Tier +2), Conviction (extra vice: Worship), Like Part of the Family (a vehicle cohort with edges and flaws), Blood Brothers (cohorts gain Thugs type).

## 8. Upgrades

Two lists: the **general upgrades every crew can take** (p. 95) and the **crew-specific upgrades** (per crew, `05-crew-types.md`). Each crew starts with two pre-selected upgrades and chooses two more (p. 94). Box counts are how many advances the upgrade costs.

| General upgrade | Boxes | Effect (p. 95) |
|---|---|---|
| Carriage House | 2 | A carriage, two goats and a stable; second box adds armour and swifter goats |
| Boat House | 2 | A boat, a dock and a shack; second box adds armour and cargo capacity |
| Hidden Lair | 1 | Secret, disguised location; relocating after discovery costs two downtime activities and coin equal to Tier |
| Mastery | 4 | Action ratings may advance to 4 (capped at 3 until then) |
| Quality: Documents, Gear, Implements, Supplies, Tools, Weapons | 1 each | +1 quality to all PCs' items of that type. Gear covers burglary and climbing gear; Tools covers demolition and tinkering tools |
| Quarters | 1 | Living quarters in the lair; without it each PC sleeps elsewhere and is vulnerable |
| Secure Lair | 2 | Locks, alarms and traps; second box adds arcane measures against spirits |
| Training: Insight, Prowess, Resolve, Playbook | 1 each | Training that track in downtime marks 2 xp instead of 1 |
| Vault | 2 | Coin capacity 8, then 16; part of it can be a holding cell |
| Workshop | 1 | Tools for tinkering and alchemy plus a small library; long-term projects without leaving the lair |
| Cohort | 2 per cohort | A gang or an expert (section 9) |

Faction consequences at creation: one faction helped (+1 status, or spend 1 coin for +2), one was screwed over (-2 status, or spend 1 coin for -1) (p. 94).

## 9. Cohorts

A cohort is a gang or an expert working for the crew (pp. 96 to 97). Recruiting costs two upgrades. A cohort card needs:

| Field | Rules |
|---|---|
| Kind | Gang or Expert (or Vehicle, via Smugglers' Like Part of the Family) |
| Type(s) | Gangs: Adepts (scholars, tinkerers, occultists, chemists), Rooks (con artists, spies, socialites), Rovers (sailors, carriage drivers, deathlands scavengers), Skulks (scouts, infiltrators, thieves), Thugs (killers, brawlers, roustabouts). Experts: free text (Doctor, Investigator, Occultist, Assassin, Spy). Up to two types; adding a type costs two upgrades. Quality is zero for actions outside its types. |
| Quality | Gang: equal to crew Tier. Expert: Tier +1. Vehicle: Tier +1. |
| Scale | Gang: equal to crew Tier. Expert: always 0 (one person). Barracks, Cloister and Training Rooms claims add +1 scale for a type. |
| Elite | Crew upgrade giving +1d to quality rolls for that type. |
| Edges | Fearsome, Independent, Loyal, Tenacious (choose one or two, matched by an equal number of flaws) |
| Flaws | Principled, Savage, Unreliable, Wild |
| Harm | Four levels: 1 Weakened (reduced effect), 2 Impaired (-1d), 3 Broken (can't act until recovered), 4 Dead. Heal one level per downtime, two if a PC spends an activity helping. Replacement costs coin equal to Tier +2 plus two downtime activities. |
| Armor | Cutter's Leader grants 1 armour and +1 effect while commanded; vehicles with two upgrade boxes have armour. |

Vehicle edges (Nimble, Simple, Sturdy) and flaws (Costly, Distinct, Finicky) are on p. 122.

Hound's trained hunting pet is "Cohort (Expert: Hunter)" on the character side and should reuse the same card.

## 10. Claims map

- "Each crew sheet has a map of claims available to be seized... The claim map displays a default roadmap for your crew type. Claims should usually be seized in an orderly sequence, by following the paths from the central square, the crew's lair." (p. 46). Off-path claims are allowed but "especially difficult" and may need investigation first (p. 47).
- Fifteen tiles in a **3 by 5 grid, lair at the centre**; connector bars join specific neighbours only. Grids and connections for all six crews are in `05-crew-types.md` and `07-claims-maps.json`.
- Each tile is toggled held or not. Turf tiles count as turf on the rep tracker. Other tiles carry a benefit shown on the sheet next to the map.
- Seizing a claim is a score against the faction that holds it (usually -2 status with them, maybe +1 with their enemies). Losing the lair suspends all claim benefits until a new lair is established (p. 47).

## 11. Contacts

- Six named NPCs per crew type with a short prompt. At creation "choose one contact who is a close friend, long-time ally, or partner in crime", which triggers +1 status with a faction friendly to them and -1 with one unfriendly (optionally +2 and -2) (p. 94). The official sheet marks contacts with the same up and down triangles as character friends **[sheet]**.

## 12. Prison claims

A separate map used when a crew member serves time (p. 149). A 3 by 4 grid with a PRISON hub. Tiles and benefits:

| Tile | Benefit |
|---|---|
| Allied Claim (four tiles) | Take a claim for your crew from a different crew type; cannot be turf |
| Cell Block Control | Never take trauma from incarceration |
| Guard Payoff (two tiles) | +1d to the Tier roll when a member is incarcerated |
| Hardcase | Advancing Tier costs 2 fewer coin |
| Parole Influence | Sentences as if wanted level were 1 lower |
| Smuggling (two tiles) | +2 load while incarcerated (4 with both); may carry coin in place of load |

Grid and connections in `07-claims-maps.json` under `prison`.

## 13. Faction status

- "Status is rated from -3 to +3, with zero (neutral) being the default starting status. You track your status with each faction on the faction sheet." (p. 45). This is a separate list: every faction with its Tier, hold and the crew's status.
- Levels (p. 46): +3 Allies, +2 Friendly, +1 Helpful, 0 Neutral, -1 Interfering, -2 Hostile, -3 War. At war with anyone: +1 heat from scores, temporarily -1 hold, PCs get one downtime activity instead of two.
- The 48 factions with tier and hold (p. 282 table) are in Nick's earlier extraction: `Downloads/blades-in-the-dark-data/factions.json`.

## 14. Crew creation flow

Six steps (p. 99):

1. Choose a crew type. Tier 0, weak hold, 0 rep, 2 coin.
2. Choose a reputation and a lair (district).
3. Establish hunting grounds; deal with the faction that claims the area: pay 1 coin; pay 2 coin for +1 status; pay nothing for -1 status.
4. Choose a special ability (default: the first).
5. Assign upgrades: two pre-selected plus two chosen; create any cohort; record the +1/-2 faction status effects.
6. Choose a favourite contact; record the +1/-1 faction status effects.

## 15. Crew advancement summary

- Fill crew XP: new special ability or two upgrade boxes, plus profits to each PC's stash.
- Fill rep (12 minus turf): weak hold becomes strong; strong hold can buy Tier +1 for new Tier times 8 coin, then weak hold.
- Changing crew type: rebuild with the same number of advances, or transfer upgrades and reassess claims (p. 49).
