# Brief for Claude Designer: interactive character and crew sheets

**Project:** Blades in the Dark virtual tabletop (private, personal project)
**Feature:** Sheet manager for player characters and their crew
**Prepared:** 2026-09-12, from the core rulebook PDF (Evil Hat Productions / One Seven Design, 2017)
**Companion files:** see `README.md` in this folder for the full pack

---

## 1. What we are building

The next major VTT feature is a sheet manager. Players need interactive sheets for every playbook (the seven living playbooks plus the three spirit playbooks) and for their crew (six crew types), so that everything they would normally pencil onto paper during a session is editable in the app: action dots, stress, trauma, harm, armour, load and items, coin and stash, XP and advances, special abilities, friends and rivals, and on the crew side rep, tier, hold, heat, wanted level, coin, upgrades, cohorts, claims, contacts and faction status.

The look and feel must be based precisely on the source material. The book's own typography, palette and component vocabulary are documented in section 4 below, and 47 reference renders of the relevant book pages are the `ref-*.png` files in this folder.

## 2. One important finding about the source

**The core rulebook does not contain the fillable sheets.** The pages that look like they should be sheets (pp. 64, 68, 72, 76, 80, 84 and 90) are full-page character art, and each crew chapter ends with an opportunities table rather than a crew sheet. The book *describes* the sheets (which column is grey, which tracker is where, how many boxes a tracker has) and it presents each playbook's content in book layout (pp. 61 to 90 for characters, pp. 100 to 123 for crews), but the actual playbook and crew sheets are separate PDF downloads.

That means two things for you:

1. Every piece of **content** on a sheet is in this pack, transcribed from the book with page references. You do not need the sheet PDFs for content.
2. For **layout and visual reference** you should go and look at the published sheets online. See section 3. Our corporate network blocks `bladesinthedark.com` and `evilhat.com` as "Games", so this has to be done from an unfiltered connection.

## 3. Please research published sheets before designing

Collect four to six examples, screenshot them, and annotate what works and what does not for an interactive (not printed) sheet. Suggested sources:

- **Official sheets.** The downloads page at `bladesinthedark.com/downloads` (Evil Hat mirrors it at `evilhat.com/home/blades-in-the-dark-downloads/`). It carries one PDF per playbook (Cutter, Hound, Leech, Lurk, Slide, Spider, Whisper), one per crew type (Assassins, Bravos, Cult, Hawkers, Shadows, Smugglers), blank character and crew sheets, and the spirit playbooks (Ghost, Hull, Vampire). These are the primary layout reference: the sheet is the canonical arrangement, the book is the canonical content.
- **Roll20 community sheet.** `github.com/Roll20/roll20-character-sheets`, folder "Blades in the Dark". An HTML/CSS reproduction of the official sheets with every field wired up. Useful for seeing how someone already solved interactive dots, clocks, and the claims grid in a browser. The `translation.json` there is also a handy field inventory.
- **Foundry VTT system.** Search GitHub for "foundryvtt blades-in-the-dark" (the megastruktur system). Another full interactive implementation, with a different take on layout density.
- **Community redesigns.** Search itch.io and DriveThruRPG for "Blades in the Dark character sheet" and "Forged in the Dark sheet". There are dark-mode variants, landscape variants, and form-fillable rebuilds. Note which readability changes people made and why.
- **Blades in the Deck.** A print-and-play card deck for the characters is already in Nick's Downloads folder (`Blades_in_the_Deck_-_Characters_PNP.pdf`). Worth a look for a card-per-ability presentation idea.

Questions to answer in your research notes:

- How do published sheets handle the four-dot action rating, and does anyone show the attribute rating (first column of dots) in a way that reads instantly?
- How is the harm grid laid out (three rows of different widths with a penalty label on each row) and how do interactive versions handle the "moves up a row when full" rule?
- How do interactive versions handle the claims map, the rep tracker with turf marked from the right, and clocks?
- What did people change from the official layout for screen use, and which of those changes we should adopt?

## 4. Visual identity, taken from the book

Measured directly from the PDF (font names from the embedded font list, colours from the vector layer).

| Element | In the book |
|---|---|
| Display type | **Kirsty Bold** (a condensed stencil-cut sans). Used for the huge white playbook name on a black torn-edge band (72 pt on p. 61), for section header bars ("STARTING ACTIONS", "DANGEROUS FRIENDS, RIVALS", "BRAVOS CLAIMS"), for the rotated side tab ("PLAYBOOK: CUTTER", "CREW: BRAVOS"), for claim tile labels (10 to 11 pt), and for page folios. A small-caps cut (Kirsty Bold SC) is used for numerals. |
| Text type | **Minion Pro** family: Regular for body, Italic for flavour and prompts, Bold for emphasised rules terms, and Bold Caption in small caps for run-in headings ("Barracks:", "starting builds"). Body is 9.5 pt. |
| Palette | Black `#000000` and white only, plus a narrow grey ramp: `#cccccc` claim tiles and label bars, `#595959` the LAIR tile, `#bcbec0` filled tracker segments, `#c7c8ca` unfilled rating dots, `#a7a9ac` and `#b1b4b6` hairlines, `#4d4d4f` tracker outlines. There is no accent colour in the sheet-relevant pages. |
| Header motif | A black band with a ragged, torn-paper bottom edge, over a faint grey map or ink-wash texture. The playbook or crew name sits in it in huge white Kirsty. |
| Side tab | A black vertical tab on the outer edge with the label rotated 90 degrees, chevron-cut at the bottom. |
| Section bars | Light grey (`#cccccc`) rectangular bars with black Kirsty caps. |
| Rating dots | Four circles per action; filled black for the rating, light grey for empty. The attribute rating equals the number of filled first-column dots. |
| Track boxes | Small square boxes in a row (stress, XP, heat, rep), thin black outlines, filled black when marked. The rep tracker marks turf from the right-hand end. |
| Harm grid | A black header bar reading HARM, three rows: level 3 has one wide cell and a "NEED HELP" label, level 2 has two cells and "-1d", level 1 has two cells and "REDUCED EFFECT" (p. 31). |
| Clocks | Circles divided into four, six or eight segments, filled clockwise. Healing clock is four segments. |
| Triangles | Up-pointing triangle marks a friend, down-pointing marks a rival, one pair per NPC name. |
| Claims map | A 3 by 5 grid of grey tiles with the LAIR tile in dark grey at the centre, joined by short grey connector bars. Not every adjacent pair is connected: the connectors define the roadmap. Exact grids and connections for all six crews and the prison map are in `07-claims-maps.json`. |

Two cautions on typography. Kirsty and Minion Pro are commercial faces; the book's licence does not extend to us embedding them in an app, so please propose open alternatives that keep the character (a condensed stencil display face and a readable old-style serif) and confirm the choice with Nick. And the book is designed for print at letter size; screen sheets need larger hit targets for dots and boxes than the printed 9.5 pt grid.

## 5. Component inventory for the character sheet

Full detail, box counts and rules per region are in `01-character-sheet-anatomy.md`. In summary the sheet has these interactive regions:

1. **Identity band:** name, alias, look, heritage (six options plus a detail line), background (seven options plus a detail line), vice (seven options plus a purveyor line).
2. **Stress track** of 9 boxes (10 to 12 with certain abilities or upgrades).
3. **Trauma:** 4 boxes and 8 named conditions to circle.
4. **Harm grid** with healing clock (4 segments).
5. **Armour:** three boxes labelled armor, heavy, special.
6. **Special abilities:** the grey middle column, 8 per playbook (7 for the Hound), plus "Veteran" slots for abilities taken from other playbooks.
7. **Playbook XP** track of 8 boxes with the playbook's XP trigger text and the three shared end-of-session triggers.
8. **Three attribute blocks** (Insight, Prowess, Resolve), each with four actions at 0 to 4 dots and a 6-box attribute XP track.
9. **Bonus dice reminder** (push yourself, Devil's Bargain, assist).
10. **Items:** the playbook's five special items plus the sixteen standard items, each with load boxes, and a load selector (light 3, normal 5, heavy 6).
11. **Coin** (4 boxes) and **stash** (40 boxes in four rows of ten).
12. **Friends and rivals:** five named NPCs with up and down triangles.
13. **Footer reminders:** teamwork manoeuvres, planning and load, gather-information questions.

## 6. Component inventory for the crew sheet

Full detail in `04-crew-sheet-anatomy.md` and per-crew content in `05-crew-types.md`.

1. **Identity band:** crew name, reputation (eight options), lair description and district, hunting grounds (district and preferred operation type; Cult has sacred sites, Hawkers a sales territory, Smugglers cargo types).
2. **Rep tracker** of 12 boxes with turf marked from the right (max 6 turf).
3. **Tier** (0 to IV shown) and **hold** (weak or strong).
4. **Heat** track of 9 and **wanted level** of 4.
5. **Coin** (4 boxes, 8 or 16 with the vault upgrade).
6. **Crew XP** track with the crew's XP trigger and three shared triggers.
7. **Special abilities** (grey column, 7 per crew type).
8. **Upgrades:** the general list shared by every crew (with multi-box upgrades such as Mastery costing four) plus the crew-specific list.
9. **Cohorts:** gangs and experts, each with type(s), quality, scale, edges, flaws, a four-level harm track and armour.
10. **Claims map** (3 by 5) with benefit text per tile.
11. **Contacts:** six named NPCs with a favourite marker.
12. **Prison claims** map (separate, shared by all crews).
13. **Faction status** (a separate faction sheet in the book): every faction at -3 to +3, with tier and hold. The 48 factions with tier and hold are already machine-readable in Nick's earlier extraction at `Downloads/blades-in-the-dark-data/factions.json`.

## 7. Interaction rules the design must accommodate

These are the behaviours that distinguish an interactive sheet from a picture of one. Sources are in the anatomy files.

- **Attribute ratings are derived.** Insight, Prowess and Resolve each equal the number of their four actions that have at least one dot. Show the derived number, do not let it be edited directly.
- **Action caps.** Max 2 dots per action at character creation, 3 thereafter, 4 once the crew has the Mastery upgrade (Vampire "Dark Talent" raises one attribute's actions to 5).
- **Stress overflow becomes trauma.** Marking the last stress box triggers a trauma: mark a trauma box, choose a condition, clear stress. Four trauma retires the character.
- **Harm cascades upward.** Recording harm in a full row moves it up a level; a fourth level is fatal. Filling the healing clock reduces every harm one level.
- **Armour boxes reset at downtime.** Special armour is only usable if the character has an ability that grants it.
- **XP tracks clear on fill and grant an advance** (a new special ability from the playbook track, a new action dot from an attribute track).
- **Load is a per-score choice** that gates how many item boxes may be ticked. Some items take two boxes; italic items are free.
- **Stash and lifestyle.** Each full row of ten stash equals one lifestyle level; two stash converts to one coin.
- **Vice roll uses the lowest attribute**, and overindulgence has four consequences to choose from.
- **Heat rolls into wanted level at 9**, with excess carrying over. Wanted level maxes at 4 and only drops through incarceration.
- **Rep tracker fills at 12 minus turf**; filling it flips weak hold to strong, or with strong hold offers a Tier purchase costing new Tier times 8 coin.
- **Crew advances** grant a special ability or two upgrade boxes, and pay each PC stash.
- **Claims are seized along connectors** by default; off-path claims are allowed but flagged as exceptional.
- **Spirit playbooks rename the tracks:** Ghost and Hull take drain instead of stress (9 and 10 boxes) and gloom or wear instead of trauma; the Vampire has 12 stress boxes, four pre-filled trauma, longer XP tracks, and accumulates strictures.

## 8. Scope and non-goals

In scope: the 7 living playbooks, the 3 spirit playbooks, the 6 crew types, cohort cards, the prison claims map, the faction status list, healing and long-term project clocks, and the character and crew creation flows that fill a new sheet.

Out of scope for this feature: GM reference tables (score opportunities, entanglements, the score generator, vice purveyors), the setting data (districts, factions, NPCs, already extracted separately), and anything to do with dice resolution beyond showing the right pool size, unless the VTT already has a roller we should hook into.

## 9. Licensing constraints

- The game's rules text is published as an SRD under **Creative Commons Attribution 3.0 Unported**. Anything we build that ships must carry the attribution: "This work is based on Blades in the Dark (found at http://www.bladesinthedark.com/), product of One Seven Design, developed and authored by John Harper, and licensed for our use under the Creative Commons Attribution 3.0 Unported license." Official licensing page: `bladesinthedark.com/licensing`.
- The CC licence covers the SRD text. It does **not** cover the book's artwork, its layout files, its typefaces, or the "Blades in the Dark" name and logo as trademarks. For a private table this is a non-issue, but design as if it might be shared one day: evoke the look with our own assets rather than embedding scans of the sheets or the book's art.
- Do not bundle the official sheet PDFs inside the app; link to them.

## 10. What we would like back from you

1. A short research note with four to six annotated examples of published sheets (section 3).
2. A component library proposal: rating dots, track boxes, clocks, harm grid, triangle pair, section bar, side tab, claims tile and connector, with sizing for mouse and touch.
3. High-fidelity mocks of one playbook sheet (Cutter is the book's default), one crew sheet (Bravos), and the faction status list, at desktop width and at a narrow width.
4. A state sketch for the interactive behaviours in section 7 that affect layout: trauma triggered from stress, harm cascade, XP fill and advance, heat to wanted level, rep to tier.
5. Your recommendation on typefaces (section 4).

## 11. Open questions for Nick

- Does the VTT already have a dice roller we should surface from the sheet (position, effect, pool size), or is the sheet read-only with respect to rolling?
- Permissions: can any player edit any sheet, or only their own, with the GM able to edit everything?
- Should sheets be reachable on a phone, or is desktop-only acceptable for the first version?
- Exact typography reproduction (with licensed fonts) versus an evocation with open fonts?
