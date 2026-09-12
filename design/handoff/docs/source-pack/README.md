# Blades in the Dark: sheet content pack

Everything needed to build interactive character and crew sheets for the Blades in the Dark VTT, extracted from the core rulebook PDF (John Harper, Evil Hat Productions / One Seven Design, 2017, hardcover PDF edition) on 2026-09-12. Companion to the setting-data extraction in `../blades-in-the-dark-data/`, which uses the same conventions.

All page numbers are the book's **printed** page numbers. In the PDF, page index = printed page + 9.

## Files

| File | Contents |
|---|---|
| `00-designer-brief.md` | The brief for Claude Designer: what we are building, the finding that the book does not contain the sheets, the request to research published sheets online, the book's visual identity (fonts, colours, motifs), component inventories, interaction rules, licensing, deliverables and open questions. |
| `01-character-sheet-anatomy.md` | Every region of a playbook sheet with box counts, rules and page references: identity, stress, trauma, harm and healing, armour, abilities, XP, attributes and actions, items and load, coin and stash, friends, footer reminders, creation flow, derived values. |
| `02-playbooks.md` | The seven playbooks in full: tagline, XP trigger, starting actions, starting builds, friends and rivals with prompts, all eight special abilities (book text), items with load. |
| `03-spirit-playbooks.md` | Ghost, Hull and Vampire: how the sheet changes (drain, gloom, wear, need, strictures), traits, features, transfer rules. |
| `04-crew-sheet-anatomy.md` | Every region of the crew sheet: identity, rep and turf, tier and hold, heat and wanted, coin and vault, crew XP, abilities, general upgrades, cohorts, claims, contacts, prison claims, faction status, creation flow. |
| `05-crew-types.md` | The six crews in full: XP trigger, hunting-grounds variant, starting upgrades, contacts, crew upgrades, seven special abilities, claims grid with connections and benefit text. |
| `06-supporting-rules.md` | Rules the sheet must implement or display: action roll, stress and trauma text, resistance, harm, standard items, teamwork, plans, gather information, coin and payoff, heat and incarceration, downtime activities, vice, advancement, faction status, crafting, name and look lists, heritage and background and vice descriptions. |
| `07-claims-maps.json` | Machine-readable claims maps for all six crews and the prison map: tile grid, hub position, and the exact connector pairs, extracted from the PDF vector layer. |
| `ref-*.png` | 47 renders (150 dpi) of the book pages that define the look: playbook pages, claims maps, harm tracker, rep tracker, cohort pages, downtime summaries, spirit playbooks. Named `ref-<topic>-p<printed page>.png`. |

## How the extraction was done

- Text was pulled from the PDF page by page (PyMuPDF) and transcribed by section. Ability, item and claim text is the book's wording; hyphenation and line breaks were removed and a few typos fixed (see errata).
- Starting-action dots were decoded from the glyph colours in the PDF (black = filled, grey = empty), not from memory.
- Claims grids and connectors were read from the vector drawing layer and verified visually against the rendered Bravos page.
- Fonts and colours were read from the embedded font list and the drawing fills.
- Box counts the book does not state (playbook XP 8, attribute XP 6, crew XP 8, veteran slots 3) were cross-checked against the Roll20 reproduction of the official sheets and are marked **[sheet]** in the anatomy files.

## Errata and inconsistencies found in the source

- p. 71 (Leech items) carries the side tab "PLAYBOOK: HOUND"; it is the Leech page.
- p. 42 says a vault expands coin storage "to 8 and then 12"; p. 95 (the upgrade's own entry) says 8 then 16. The pack uses 16.
- p. 63 lists five Cutter items; the Spiritbane Charm that some editions print with the Cutter is in the standard items list on p. 88.
- Typos corrected in transcription: "preistess" (Malista), "Stud y+1" (Hound Sniper build), "the whole word as potential prey" (Hound), "The can't go outside" (Hawkers), "you get several offers" spacing, "Alcahest" kept as printed.

## Not included

- GM tables: score opportunities per crew, entanglements, score generator, vice purveyors (already in `../blades-in-the-dark-data/vice_purveyors.json`).
- The faction list (already in `../blades-in-the-dark-data/factions.json`, 48 factions with tier and hold, which is exactly what the faction status sheet needs).
- The official sheet PDFs themselves. They are separate downloads from `bladesinthedark.com/downloads`; the brief asks the designer to collect them.

## Licence note

The rules text of Blades in the Dark is available as an SRD under Creative Commons Attribution 3.0 Unported. Required attribution: "This work is based on Blades in the Dark (found at http://www.bladesinthedark.com/), product of One Seven Design, developed and authored by John Harper, and licensed for our use under the Creative Commons Attribution 3.0 Unported license." The licence does not cover the book's art, layout, typefaces or trademarks. The `ref-*.png` renders are for private design reference only.
