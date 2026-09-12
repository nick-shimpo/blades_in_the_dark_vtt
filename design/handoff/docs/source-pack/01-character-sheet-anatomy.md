# Character sheet anatomy

Every region of a Blades in the Dark playbook sheet, what it holds, how many boxes it has, and the rules that change it. Page numbers are the printed page numbers of the core rulebook (PDF page = printed page + 9). Where the book states a fact about the sheet itself, it is quoted; where a box count is only visible on the official sheet PDF, it is marked **[sheet]** and was cross-checked against the Roll20 reproduction of the official sheets.

The book calls the sheet a **playbook**: "A playbook is what we call the sheet with all the specific rules to play a certain character type" (p. 52). Seven living playbooks (p. 52) plus three spirit playbooks (pp. 213 to 219, see `03-spirit-playbooks.md`).

---

## 1. Identity band

| Field | Type | Options and rules | Source |
|---|---|---|---|
| Name | text | Sample names, family names and aliases in `06-supporting-rules.md` section 12 | p. 55, p. 56 |
| Alias | text | Underworld nickname, optional | p. 55 |
| Look | text | "a few evocative words"; samples on p. 56 | p. 55 |
| Heritage | one of six, plus a free-text detail line | Akoros, The Dagger Isles, Iruvia, Severos, Skovlan, Tycheros. "Circle it on the list on your playbook, then write a detail about your family life on the line above." Tycherosi also record a demonic telltale. | p. 53 |
| Background | one of seven, plus a detail line | Academic, Labor, Law, Trade, Military, Noble, Underworld | p. 54 |
| Vice | one of seven, plus a purveyor line | Faith, Gambling, Luxury, Obligation, Pleasure, Stupor, Weird. "Describe it on the line above with the specific details and the name and location of your vice purveyor." | p. 55 |

## 2. Stress

- **9 boxes** by default. "This ability gives you an additional stress box, so you have 10 instead of 9. The maximum number of stress boxes a PC can have (from any number of additional special abilities or upgrades) is 12." (p. 67, Hound's Survivor).
- Modifiers: Hound Survivor +1; crew upgrades Composed (Hawkers) and Steady (Shadows, Smugglers) +1 each; Vampire has 12.
- Sources of stress: pushing yourself (2 per benefit), assisting (1), leading a group action (1 per teammate who rolled 1 to 3), resisting (6 minus highest die), ignoring your vice (stress equal to trauma), ability costs.
- Clearing stress: indulging vice (clear the highest die of a roll with your lowest attribute), a critical on a resistance roll clears 1, some abilities.
- **When the last box is marked, the character suffers trauma** and is taken out of the scene; they return with zero stress and their vice satisfied for the next downtime (p. 13).

## 3. Trauma

- **4 boxes** and **8 conditions** to circle: Cold, Haunted, Obsessed, Paranoid, Reckless, Soft, Unstable, Vicious (p. 14). Condition descriptions in `06-supporting-rules.md` section 3.
- Conditions are permanent. The fourth trauma retires the character (or sends them to prison to take the fall for the crew's wanted level).
- Crew upgrades Hardened (Assassins, Bravos) and Ordained (Cult) add a fifth trauma box and "may bring a PC with 4 trauma back into play".
- Playing a trauma condition so that it causes trouble earns XP (shared trigger).

## 4. Harm and healing

The harm tracker (p. 31) is a black-headed grid:

| Row | Cells | Penalty label | Meaning |
|---|---|---|---|
| 3 (severe) | 1 wide cell | NEED HELP | Incapacitated unless helped or pushing yourself |
| 2 (moderate) | 2 cells | -1d | One fewer die on affected rolls |
| 1 (lesser) | 2 cells | REDUCED EFFECT | One level less effect on affected rolls |

Rules that the control must implement:

- Each cell holds a short free-text injury ("Shattered Right Leg").
- "If you need to mark a harm level, but the row is already filled, the harm moves up to the next row above." Overflow past level 3 is level 4, fatal or catastrophic (p. 31, p. 33).
- Penalties apply only when the harm is relevant to the situation, so the sheet shows the penalty and the player decides.
- **Healing clock: 4 segments.** Recovery ticks it like a project (1 to 3: one, 4/5: two, 6: three, critical: five). "When you fill your healing clock, reduce each instance of harm on your sheet by one level, then clear the clock." Excess ticks roll over. "Whenever you suffer new harm, clear any ticks on your healing clock." (p. 155). Cutter's Vigorous permanently fills one segment (a 3-clock in effect) (p. 63).
- Hound's Tough as Nails shifts every penalty one level down but records harm at its original level (p. 67).
- Examples by level (p. 31): Fatal (4) Electrocuted, Drowned, Stabbed in the Heart. Severe (3) Impaled, Broken Leg, Shot in Chest, Badly Burned, Terrified. Moderate (2) Exhausted, Deep Cut to Arm, Concussion, Panicked, Seduced. Lesser (1) Battered, Drained, Distracted, Scared, Confused.

## 5. Armor

"Each character sheet has a set of three boxes to track usage of armor (standard, heavy, and special)" (p. 54).

- **armor** and **heavy**: usable when the matching item is carried (Armor is 2 load; +Heavy adds 3 load, 5 total, p. 88). Mark a box to reduce or avoid a consequence instead of rolling to resist. "When an armor box is marked, it can't be used again until it's restored. All of your armor is restored during downtime." (p. 33).
- **special**: only usable if the character has a special ability that references special armour (Battleborn, Focused, Fortitude, Shadow, Subterfuge, Mastermind, Warded). "If you don't have any special abilities that use special armor, then you can't use that armor box at all." (p. 54). Restored at the beginning of downtime.
- Hull frames have natural armour that does not count against load (p. 217).

## 6. Special abilities

- "They're in the gray column in the middle of the character sheet. If you can't decide, choose the first ability on the list. It's placed there as a good first option." (p. 57).
- Eight abilities per playbook (seven for the Hound), each with a checkbox; one chosen at creation, more via playbook XP advances. Full text per playbook in `02-playbooks.md`.
- **Veteran**: the sheet provides slots for abilities taken from other playbooks ("You may keep some of the special abilities already earned as Veteran advances", p. 49). The Roll20 reproduction provides three veteran slots **[sheet]**.
- Some abilities need extra state on the sheet: Ghost Hunter's pet arcane ability, Venomous' chosen poison, Expertise's chosen action, Ritual's known rituals, Alchemist/Artificer/Strange Methods' known formulas and designs, Vengeful's extra XP trigger, Survivor's extra stress box, Mule's raised load limits.

## 7. Playbook XP and triggers

- **Playbook XP track: 8 boxes [sheet].** Filling it clears the track and grants "an additional special ability" (p. 48).
- Text printed with the track (p. 48):
  - "When you make a desperate action roll, mark 1 xp in the attribute for the action you rolled."
  - At the end of the session, for each trigger, mark 1 xp if it happened at all, or 2 xp if it happened a lot:
    1. The playbook-specific trigger (for example Cutter: "You addressed a challenge with violence or coercion.")
    2. "You expressed your beliefs, drives, heritage, or background."
    3. "You struggled with issues from your vice or traumas."
  - "You may mark end-of-session xp on any xp tracks you want (any attribute or your playbook xp track)."
- Training during downtime marks 1 xp in one track (2 with the matching crew Training upgrade); a given track can be trained once per downtime (p. 48, p. 155).

Per-playbook trigger phrases:

| Playbook | Earn xp when you address a challenge with... |
|---|---|
| Cutter | violence or coercion |
| Hound | tracking or violence |
| Leech | technical skill or mayhem |
| Lurk | stealth or evasion |
| Slide | deception or influence |
| Spider | calculation or conspiracy |
| Whisper | knowledge or arcane power |

## 8. Attributes and actions

Twelve actions in three attribute groups (p. 10, p. 11). Each action has **four dots**; the attribute rating "is equal to the number of dots in the first column under that attribute", that is, the count of its actions rated 1 or more.

| Insight | Prowess | Resolve |
|---|---|---|
| Hunt | Finesse | Attune |
| Study | Prowl | Command |
| Survey | Skirmish | Consort |
| Tinker | Wreck | Sway |

- Each attribute has its own **XP track of 6 boxes [sheet]**; filling it grants "an additional action dot to one of the actions under that attribute" (p. 48).
- Caps: "no action rating may have more than two dots" at creation; "After creation, action ratings may advance up to 3. When you unlock the Mastery advance for your crew, you can advance actions up to rating 4." (p. 57). Crew abilities such as Deadly, Dangerous, Chosen, Silver Tongues, Everyone Steals, Renegades add +1 to a named action up to 3, overriding the creation cap (p. 102 and siblings). Vampire's Dark Talent allows 5 in one attribute's actions (p. 219).
- Creation: the playbook's starting dots plus four more (one for heritage, one for background, two free), seven total (p. 54).
- Attribute rating is the resistance roll pool: Insight resists deception or understanding, Prowess physical strain or injury, Resolve mental strain or willpower (p. 32).
- One-line action descriptions for tooltips are in `06-supporting-rules.md` section 1.

## 9. Bonus dice reminder

Printed on the sheet next to the actions **[sheet]**; the rules are on p. 13, p. 21 and p. 134:

- **Push yourself:** take 2 stress for +1d, or +1 effect, or to act while incapacitated (each once per action).
- **Devil's Bargain:** +1d in exchange for a complication the GM offers. Push and bargain do not stack for the same die.
- **Assist:** a teammate takes 1 stress to give you +1d.

## 10. Items and load

- "You have access to all of the items on your character sheet. For each operation, decide what your character's load will be. During the operation, you may say that your character has an item on hand by checking the box for the item you want to use, up to a number of items equal to your chosen load." (p. 57).
- **Load selector:** light (1 to 3 load: faster, less conspicuous, blends in with citizens), normal (4 or 5: looks like a scoundrel), heavy (6 or more: slower, looks like an operative). Maximum load is heavy plus 2, so 8. Cutter's Mule raises the thresholds to 5, 7 and 8 (p. 57, p. 62).
- "Some items count as two items for load (they have two connected boxes). Items in italics don't count toward your load." (p. 57).
- Each playbook lists five special items (fine items and oddities) and every sheet carries the sixteen standard items (p. 88). All in `02-playbooks.md`. One unit of coin carried takes one load (p. 42).
- Crew upgrades named Rigging give 2 free load for a category of items; Hawker and Smuggler Rigging conceal items instead (crew chapter).

## 11. Coin and stash

- **Coin: 4 boxes.** "More than 4 coin is an impractical amount to keep lying around. You must spend the excess or put it in your stash." (p. 42).
- **Stash: 40 boxes in four rows of ten.** "Each full row of stash (10 coins) indicates the quality level of the scoundrel's lifestyle, from zero (street life) to four (luxury)." Retirement outcomes: 0 to 10 poor soul, 11 to 20 meager, 21 to 39 modest, 40 fine (p. 43).
- "For every 2 stash removed, you get 1 coin in cash." (p. 43).
- Stash comes from payoff splits, crew advances (+1 stash, +2 per crew Tier, p. 49), and Slide's A Little Something on the Side (+2 per downtime).
- Coin uses that the UI can offer as actions: extra downtime activity (1 coin), improve a downtime roll result by one level per coin, avoid entanglements, pay Tier advancement (p. 42).

## 12. Friends and rivals

- Five named NPCs per playbook, each with an up-pointing triangle (close friend) and a down-pointing triangle (rival). At creation mark one of each (p. 55, p. 57). The lists and the book's prompt text for each NPC are in `02-playbooks.md`.

## 13. Footer reminders

Printed across the bottom of every playbook sheet **[sheet]**; the book confirms two of them: "They're listed at the bottom of the character playbook sheets" (teamwork, p. 134) and "Some example questions are on the bottom of the character sheet" (gather information, p. 36).

- **Teamwork:** Assist (1 stress, +1d), Lead a group action (best result counts, leader takes 1 stress per 1 to 3), Protect (take a consequence for a teammate, may resist), Set up (grant +1 effect or improved position to followers). Full text in `06-supporting-rules.md` section 7.
- **Planning and load:** choose a plan and provide its detail; choose your load. The six plans with their details are in `06-supporting-rules.md` section 8.
- **Gather information:** example questions in `06-supporting-rules.md` section 9.

## 14. Character creation flow

The sheet's "new character" flow should follow the eight-step summary on p. 57:

1. Choose a playbook.
2. Choose a heritage and write a family detail.
3. Choose a background and write a history detail.
4. Assign four action dots (max 2 per action).
5. Choose one special ability (default: the first).
6. Mark one close friend and one rival.
7. Choose a vice and its purveyor.
8. Record name, alias and look.

Each playbook also offers four **starting builds** (named templates that pre-fill the four dots and the ability); they are listed per playbook in `02-playbooks.md` and make a good "quick start" option.

## 15. Derived and computed values worth showing

- Attribute ratings (from action dots).
- Current load class from ticked item boxes, and remaining load.
- Lifestyle level from stash rows.
- Vice roll pool (lowest attribute) and stress-if-ignored (equal to trauma count).
- Number of advances available (filled tracks).
- Harm penalties in effect.
- Special armour availability (true only if a qualifying ability is checked).
