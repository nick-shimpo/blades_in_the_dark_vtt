# Handoff: Doskvol Table — a shared Blades in the Dark table

## Overview

A virtual tabletop for one Blades in the Dark campaign, used live at the table by the GM and players. Four views under one header:

1. **Table** — the centrepiece. A pan/zoom map of everything in play: crew, factions, NPCs, places and districts as cards, one-way labelled edges between them, progress clocks on the cards. Cards can be added from the full rulebook roster (50 factions, 179 NPCs, 84 places, 12 districts) or made up.
2. **Sheets** — interactive character sheets for the seven playbooks and the crew sheet for the six crew types, with the rules wired in (stress → trauma, harm cascade, healing, XP → advances, load, rep/turf, heat → wanted, claims map, cohorts) and a full action-roll / resistance-roll dialog.
3. **Sparks** — GM random tables (score seeds, NPCs, names, faction finder) that can drop entities onto the Table.
4. **Play** — moment-of-play procedure reference.

The single source of truth is one JSON document per campaign, the **ledger** (`docs/ledger-schema.md`). The job now is to turn the prototype into a hosted web app that several people use at once (`docs/architecture.md`).

## About the design files

The files in `reference/` are **design references created in HTML** — a working prototype that shows the intended look and behaviour. They are not production code to copy. `Doskvol Table.dc.html` is a template + a JavaScript logic class rendered by a small runtime (`support.js`); open it locally in Chrome next to the four `.js` files to click through everything. The task is to **recreate these designs in a proper web codebase** (a static SPA — see `docs/architecture.md` for the recommended stack and sync model), using the bundled JSON in `data/` as the game content and keeping the ledger format so existing campaign files import.

## Fidelity

**High-fidelity.** Colours, type, spacing, component shapes and interactions are final; recreate them faithfully. Where this README and the prototype disagree, the prototype wins.

## Package contents

```
README.md                      this file
docs/
  ledger-schema.md             the campaign document: nodes, edges, clocks, character + crew sheets
  rules-engine.md              every derivation and state transition, by area
  architecture.md              hosting + multi-user sync recommendation, module layout, licensing
  source-pack/                 the rulebook transcription brief and anatomy docs the sheets were built from (page refs inside)
data/
  book.json                    factions, npcs, locations, districts, vice purveyors, setting, generators (from the core book)
  sheets.json                  playbooks (abilities, items, friends, builds), crews (abilities, upgrades, contacts, claims + benefits),
                               actions, heritage/background/vice, trauma conditions, standard items, general upgrades, cohort tables
  sparks.json                  spark tables, per-playbook prompt tables, name lists, venues, district one-liners
  claims-maps.json             3×5 claims grids + connector pairs for the six crews and the prison map
  ledger.example.json          a small valid campaign document
reference/
  Doskvol Table.dc.html        the prototype (template + logic)
  support.js                   its runtime
  bitd-book.js, bitd-data.js, bitd-sheets.js   the same content as data/*.json, as ES modules the prototype imports
```

## Design tokens

**Palette — "Ink Ledger"** (old paper, soot, dried blood; no pure black or white anywhere)

| Token | Hex | Use |
|---|---|---|
| paper | `#e7dfc9` | app background, edge label pills |
| paper-light | `#f2ead2` | cards, panels, dialogs, buttons |
| paper-hover | `#fff6dd` | hover on paper buttons |
| clock-face | `#f6efdb` | empty clock segments, dice |
| ink | `#221c13` | text, borders, filled boxes/dots, dark bands |
| red | `#8c2f1b` | accent: BOOK button, filled clock, hostile, primary actions, warnings |
| red-hover | `#a63a22` | |
| muted | `#5c503b` | secondary text, lair claim tile |
| faint | `#9a8d70` | placeholders, disabled |
| sheet-rail | `#ddd3b8` | Sheets left rail, special-abilities column |
| sheet-bar | `#d8cfb5` | section header bars, unheld claim tiles, harm penalty cells |
| sheet-bar-dark | `#c9bd9d` | special-abilities bar, claim connectors, location card corner |
| hairline | `rgba(34,28,19,0.35)` | dotted/dashed dividers |
| status tints (−3…+3) | `#eed6ca #eedbd0 #efe3d2 #f2ead2 #ebead2 #e3e8d0 #dde5cb` | card paper by crew status |
| status inks (−3…+3) | `#5e1e10 #8c2f1b #9c4a2c #8a7d64 #586b3a #3f6a45 #2d5a3a` | status band + card border |
| edge green | `#3f6a45` | friendly edge labels |

Shadows are hard-offset, never blurred: cards `4px 4px 0 rgba(34,28,19,0.28)` (Table, scaled by tier — see rules §1), panels `3px 3px 0 rgba(34,28,19,0.18–0.35)`, dialogs `6–8px 8px 0 rgba(34,28,19,0.35)`. Radii: Table cards 14 px; everything else square. Dotted dividers `1px dotted rgba(34,28,19,0.3)`; header rule `4px double #221c13`.

**Type**

| Role | Family (Google Fonts) | Sizes |
|---|---|---|
| Table titles, tabs, card names | IM Fell English SC | crew name 22, tab 15 (2 px tracking), card name 21/1.05 |
| Table body | IM Fell English | 14.5–17 italic for one-liners and notes; 15–16 clock names |
| Labels, counts, tags | Courier Prime 700 | 9–13 px, 1–3 px tracking, uppercase |
| Sheets display | Big Shoulders Stencil (fallback Big Shoulders Stencil Display, Impact) 700–800 | band name 46/1, playbook 38, section bars 14 (2.5 px tracking), strip labels 12 (2.5 px), tile labels 11, dice 26, pool 44 |
| Sheets text | Crimson Pro 400/600/700, italic | body 14–17, ability names 16 700, item names 15, chips 13.5 |

Minimum hit target for boxes/dots: 17 px visual inside a ≥ 24 px row; clocks 58 px; all controls are real `<button>`s.

## Screens

### Header (all views)

Height ≈ 46 px, `padding 8px 16px`, bottom rule `4px double ink`. Left → right: crew name (editable input, IM Fell SC 22, transparent, width 240), tab group **Table · Sparks · Play · Sheets** (bordered buttons joined by shared 1 px borders; active = ink background, paper text; keys 1–4 switch), a red italic hint that only appears mid-action ("click a card to connect · esc cancels" / "remove this card? …"), flexible space, **FIT** (Courier 11/700, paper button), **▤ BOOK** (red button, paper text, `1px 1px 0 ink` shadow), **☰** menu (34 × 30, three 16 × 2 ink bars). Menu drops down 280 px wide: LEDGER header with file name + status (`SAVED ✓ 21:14` / `SAVING…` / `NEEDS RECONNECT`), then rows: Save ledger as new file… · Open ledger file… · Reconnect file… · Unlink file · Copy ledger to clipboard · Export a copy… · Import a copy… · Paste a ledger… · New campaign… (red). The ☰ button itself turns red when the file needs reconnecting. In production the file items become campaign/sharing items; keep Export/Import/Paste.

### Table

Canvas fills the view; dotted grid background `radial-gradient(rgba(34,28,19,0.14) 1px, transparent 1px)` at 26 px. Cursor grab/grabbing; wheel zooms around the cursor; drag empty space pans; click empty space deselects.

**Card** (`nodeW`: crew/faction/district 280, npc/place/org 260, other 250; height by content)
- Rounded 14 px, paper tinted by status, border `1 + 0.5·tier` px solid in the status ink (neutral = ink), hard shadow growing with tier. Crew card is inverted: ink background, paper text, always neutral.
- Header row `padding 9px 12px 0`: type glyph (⚑ faction, ♟ npc, ⌖ place, ◈ district, ◆ crew, ⚖ org, ✦ other; 15 px; type name as tooltip only), tier pill (IM Fell SC 13 in a 1 px `currentColor` border, `0 6px`), spacer, `⤢` dossier button at 50 % opacity.
- Name: IM Fell SC 21/1.05, `padding 5px 12px 3px`.
- One line: IM Fell English 14.5 italic, 88 % opacity, `padding 0 12px 9px`.
- Clocks block (always present, `border-top 1px solid rgba(120,108,88,0.5)`, `padding 9px 12px`, rows 10 px apart): 58 px dial (see Clock), then name (16/1.2, wraps, click → inline 2-row textarea, Enter/Esc commits), under it `3 / 6` (Courier 12.5/700, click cycles segments 4·6·8·10·12), **+** and **−** buttons (30 × 24, 1 px `currentColor` border; + hovers red, − hovers ink), ✕ remove at 40 % opacity. Below the rows a ghost button `◔ + CLOCK` (dashed border, 50 % opacity → 100 % on hover) creates "New clock" (6) and opens its name for editing.
- Status band (all but crew; districts/places only when ≠ 0): full-width bottom strip, Courier 11/700 2 px tracking, paper text on the status ink, `padding 5px 8px`; click warmer, right-click colder.
- Selected: `0 0 0 2px ink` ring (red when armed for deletion). Armed: red tag under the card `✕ REMOVE — CLICK TO CONFIRM · ESC`.
- Four ports (11 px paper dots with ink border, 60 % opacity, 100 % when selected; hover scales 1.4 and turns red) centred on each side; drag from a port to another card to draw an edge (dashed red line with arrow while dragging).
- Double-click (or ⤢, or radial DOSSIER) opens the dossier.

**Clock**: circle, `2.5px solid ink` (red + `0 0 0 3px rgba(140,47,27,0.35)` ring when full), face `conic-gradient(red 0 → filled°, clock-face → 360)` with segment dividers `repeating-conic-gradient(from −1.5deg, ink 0 3deg, transparent 3deg → seg)`. Click ticks, right-click unticks, shift-click unticks.

**Edge**: cubic bezier from port to port (control distance `clamp(30, 0.4·dist, 150)`), `1.8px` stroke `rgba(34,28,19,0.75)` (2.4 px red while editing), arrowhead marker 7 px at the target. Label pill at the midpoint: Courier 13 on `paper`, `1px 7px`, border transparent (dashed faint `label` placeholder when empty, red on hover); click → inline input (`1px solid red`, `#fff6dd`, width fits text 110–260) + ✕ delete button 26 × 26 (red on hover). Enter/Esc/blur commits.

**Radial menu** (right-click): dashed ring r = 76 px around the click point, 48 px circular paper buttons with 18 px glyphs (hover: ink bg, paper glyph), Courier 9 px labels 46 px outside the ring with a translucent paper backing. On empty canvas: ⚑ FACTION · ♟ NPC · ⌖ PLACE · ◈ DISTRICT · ✚ CUSTOM (opens the Book on that tab, placing at the click point). On a card: ⤢ DOSSIER · ⤝ CONNECT (click a target card; crosshair cursor) · ✦ RELATED (book entries only) · ◔ CLOCK · ✕ REMOVE (red).

**RELATED popover**: 300 × ≤380 anchored beside the card: header `RELATED` + name, rows glyph · name · italic role · action (`+ ADD` red / `⤝ LINK` red / `✓ LINKED` muted). Adding places the entry next to the source and links it with the book relationship as the label (Leads, Member, Holds, In, Based in, Frequents, Purveys at, Allied, Hostile, Contests).

**From the Book** dialog (780 × ≤80 vh, top-aligned): title, tabs FACTIONS · NPCS · PLACES · DISTRICTS, search input (autofocus), filter chips (factions by category; NPCs LEADERS · PLAYBOOK FRIENDS · CREW CONTACTS · VICE PURVEYORS; places by district), a first row `＋ New faction of your own` (red text, darker paper), then rows: name · Courier meta (category / tier+hold / roles / faction / type / district) · italic summary · right-aligned `+ ADD` or `ON TABLE`. Clicking an ON TABLE row centres that card.

**Dossier** (modal, `min(1160px, 94vw) × min(860px, 92vh)`, radial parchment `#f6efdb → #eee2c4 → #e2d2ab`, inset glow `0 0 90px rgba(120,90,40,0.28)`, 2 px ink border, `8px 8px 0` shadow). Two columns `minmax(240px,330px) | 1fr`:
- Left: source line (`FROM THE BOOK · p. 297 · FACTION` / `YOUR OWN ENTRY`), TYPE select + TIER input, DISTRICT input with district datalist, faction-only HOLD (STRONG/WEAK) and CATEGORY, STATUS WITH THE CREW as seven −3…+3 buttons (selected one takes the status ink) with the status word, CLOCKS (36 px dials, rename, segments select, RESET, ✕, add row: name + size + red ADD), CONNECTIONS (→/← glyph, partner name, wrapped label, ✕; `⤝ CONNECT TO…`), and at the bottom a red-bordered two-step `✕ REMOVE FROM THE TABLE`.
- Right: name (IM Fell SC 34, editable), one-line (17 italic, placeholder shows the derived line), a facts grid `118px | 1fr` (Courier 9.5 labels; click a value to edit inline, Enter/blur commits), then prose sections per type (faction: TURF, NOTABLE NPCS, NOTABLE ASSETS, QUIRKS, SITUATION; npc/place: DESCRIPTION; district: DESCRIPTION, SCENE, STREETS, BUILDINGS, LANDMARKS, SPECIAL RULE, NOTABLES) plus MOVES (not for places/districts) and NOTES; click to edit as markdown in a textarea (`**bold** *italic* - lists # headings > quotes` rendered).

### Sheets

Layout: left rail 216 px (`sheet-rail`, 1 px ink right border) + scrolling sheet area. Rail: `THE CREW` label (Big Shoulders 13, 3 px tracking, muted), crew card (name Big Shoulders 19 + italic "Shadows · Tier 0 · weak hold"), `SCOUNDRELS`, one card per character (name + "Lurk · stress 3/9"), dashed `+ NEW SCOUNDREL`, CC-BY note at the bottom. Selected card = ink background, paper text.

Empty state: `SHEETS` 48 px + an italic explanation. **Playbook picker**: `CHOOSE A PLAYBOOK` 44 px, italic subline, grid of 7 cards `minmax(250px,1fr)`: name 32 px, italic tagline, muted "Good at …. Play it to ….", CANCEL. **Crew type picker**: same with 6 cards including the crew's XP trigger.

**Character sheet**
- Sticky top block. Ink band (`padding 14px 26px 22px`) with a torn bottom edge — `clip-path: polygon(0 0, 100% 0, 100% 86%, 96% 100%, 93% 89%, 88% 97%, 82% 90%, 76% 99%, 70% 91%, 63% 98%, 57% 89%, 50% 97%, 44% 90%, 37% 99%, 31% 91%, 25% 97%, 19% 89%, 13% 98%, 8% 91%, 3% 99%, 0 90%)`: NAME input (Big Shoulders 46, paper text, dashed paper underline at 30 %), *alias* (Crimson italic 20), *look* line (16); right-aligned PLAYBOOK label 11/3 px tracking at 70 %, playbook name 38, italic tagline 14.5.
- Tracker strip on paper-light under the band (`margin-top −8px` so the tear overlaps it), `padding 10px 26px 12px`, groups 26 px apart, each: label row (Big Shoulders 12, 2.5 px tracking + muted count) then controls. STRESS 9–12 boxes (24 px, `1.5px solid ink`, filled ink) · TRAUMA 4–5 boxes + 8 condition chips (Crimson 13.5, 1 px border, on = ink) with a red italic hint "trauma — choose a condition" · ARMOR three labelled boxes (ARMOR HEAVY SPECIAL 10 px labels; SPECIAL dashed faint and not-allowed unless granted) + "restore" · LOAD segmented `LIGHT 3 | NORMAL 5 | HEAVY 6` (Big Shoulders 11) + `used / limit` (red when over) · COIN 4 boxes.
- Body: `grid repeat(auto-fit, minmax(340px,1fr))`, 20 px gaps, `padding 20px 26px 48px`; three columns of stacked panels. Panels: `1px solid ink` on paper-light with `3px 3px 0 rgba(34,28,19,0.18)`; section bar `sheet-bar`, Big Shoulders 14 / 2.5 px tracking, `padding 5px 10px`.
  - Column 1: **HARM** (ink bar; grid `34px | 1fr | 90px`: level button 3/2/1 in Big Shoulders 22 — hover red, injury inputs IM Fell italic 17 with faint example placeholders, penalty cell on `sheet-bar` in Big Shoulders 10.5 — NEED HELP · −1D · REDUCED EFFECT; 58 px 4-segment HEALING clock beside; red banner when level 4). Then three attribute panels **INSIGHT / PROWESS / RESOLVE** (ink bar: name, derived rating in a 22 px paper-bordered button that opens the resistance roll, `ADVANCE ×1 · +1 DOT` red badge when earned, `XP` + 6 boxes of 16 px) with four action rows: 4 dots (18 px circles, first dot 9 px apart from the rest), action name button (Crimson 17 uppercase 1.5 px tracking, hover red, click → roll dialog), `2D` pool in red Big Shoulders 13. Then a muted "Bonus dice" reminder paragraph.
  - Column 2: **SPECIAL ABILITIES** on `sheet-rail` with a `sheet-bar-dark` bar: rows with a 22 px checkbox, name (Crimson 16/700), text 14/1.35 in `#3a3126`, italic note 13 muted; ticked rows get a `rgba(255,250,235,0.6)` wash; veteran rows carry a red `VETERAN · SPIDER` tag and ✕. Footer: `VETERAN` + playbook select + "add an ability from that playbook…" select. **PLAYBOOK XP** (8 boxes in the bar + the trigger texts, ◆ bullets, Vengeful adds a line). **DANGEROUS FRIENDS, RIVALS** (bar text is the playbook's): ▲ ▼ toggles (red when set, 28 % ink when not), name 16/700, muted role; prompt as tooltip.
  - Column 3: **ITEMS** (two-column list: load boxes 17 px — one per load, round for 0-load — then name; playbook items bold first, standard items after; italic = free; description + load as tooltip; bar shows `used / limit · class`). **STASH** (4 rows × 10 boxes 17 px with row numbers, label `stash / 40 · lifestyle n — meager`, buttons `2 STASH → 1 COIN` and `1 COIN → STASH`). **HERITAGE · BACKGROUND · VICE** (chip rows + an IM Fell italic detail line each). A red-bordered two-step `REMOVE SHEET` button.

**Crew sheet**
- Same band (crew name shared with the header; italic blurb; CREW / type / tagline on the right) and strip: REP 12 boxes with hatched turf from the right (`repeating-linear-gradient(135deg, ink 0 2px, transparent 2px 6px)`) + red `DEVELOP → STRONG HOLD` / `DEVELOP → TIER II · 16 COIN` when full · TIER five boxes labelled 0 I II III IV + WEAK | STRONG segmented · HEAT 9 boxes then WANTED 4 red boxes · COIN 4/8/16 (wraps) · CREW XP 8 + red `ADVANCE ×1 · ABILITY or 2 UPGRADES`.
- Column 1: **CLAIMS** — grid `1fr 14px 1fr 14px 1fr 14px 1fr 14px 1fr` × `62px 14px 62px 14px 62px`; tiles Big Shoulders 11/1 px tracking centred, unheld `sheet-bar`, held ink/paper, lair `muted`/paper, off-path held = dashed red border, focused tile 2 px red inset outline; connectors 12 px bars (`sheet-bar-dark`, ink when both ends held). Below: `TILE NAME` + benefit text (hover to preview, click to seize). **LAIR & HUNTING GROUNDS** (label changes per crew: SACRED SITES / SALES TERRITORY / CARGO TYPES): REPUTATION chips, LAIR line + district select, district select + 4 operation chips + italic reminder, DEITY line for Cult.
- Column 2: **SPECIAL ABILITIES** (7, same row style). **UPGRADES** two-column list (crew-specific bold first, then general; boxes = cost 1–4; tooltip text) with the crew-xp triggers paragraph under it.
- Column 3: **COHORTS** (`+ COHORT`): each card has GANG | EXPERT segmented, name line, `QUALITY 0 · SCALE 0 · ELITE` stat, type chips (gang, max 2) or expertise line (expert), EDGES / FLAWS chips (max 2 each), HARM 4 boxes with the level name, ARMOR box, ✕. **CONTACTS** (6, ▲▼ as friends). Two-step red `CHANGE CREW TYPE`.

**Roll dialog** (600 px, paper-light, 2 px ink border, `8px 8px 0` shadow; ink header with the action in Big Shoulders 28 + italic character name). Action mode: grid `90px | 1fr` rows POSITION (CONTROLLED | RISKY | DESPERATE), EFFECT (LIMITED | STANDARD | GREAT), +1D FROM (PUSH · 2 STRESS | DEVIL'S BARGAIN, mutually exclusive) + assist select ("assist from Cross"), ALSO (PUSH FOR +1 EFFECT · 2 STRESS). Resist mode: one explanatory sentence. Then a rule, pool in Big Shoulders 44 (`3D`, or `2D↓` for zero dice) with a muted note, red ROLL button (AGAIN after a roll). Result: 42 px dice tiles (6s red), label in Big Shoulders 26 (`CRITICAL` / `FULL SUCCESS` / `PARTIAL — CONSEQUENCE` / `BAD OUTCOME` in red), the outcome sentence for the position, and a red "Applied: 2 stress · 1 xp in prowess" line.

### Sparks and Play

Port as they are in the prototype (`showSparks` / `showPlay` blocks and the `// SPARKS` section of `renderVals`). Sparks: chip row of table groups (GENERIC · DOSKVOL · FACTIONS · PLAYBOOKS · SCORE · NPC), score-seed engine, NPC engine, faction finder whose rows add to the Table (`+ TABLE` / `ON TABLE`), playbook prompt tables, name generator. Play: static procedure cards. Data in `data/sparks.json`.

## Interactions & behaviour

All state transitions are specified in `docs/rules-engine.md`. Global keys: `1–4` switch views (not while typing), `Esc` closes the innermost thing (label edit → clock name → roll dialog → dossier/menus → selection), `Delete/Backspace` arms then removes the selected card on the Table. No animations beyond hover colour changes; the tear, shadows and rings are static. Everything saves immediately (debounced 400 ms in the prototype) — there is no Save button.

## Assets

None. All imagery is CSS (torn edge via clip-path, clocks via conic gradients, dotted grid, hatched turf). Glyphs are Unicode (⚑ ♟ ⌖ ◈ ◆ ⚖ ✦ ◔ ⤢ ⤝ ▲ ▼ ✕ ☰). Fonts from Google Fonts (self-host for production): IM Fell English, IM Fell English SC, Courier Prime, Big Shoulders Stencil, Crimson Pro.

## Out of scope for this pass (agreed with Nick)

Spirit playbooks (Ghost, Hull, Vampire — content is in `docs/source-pack/03-spirit-playbooks.md`), prison claims, a separate faction-status list (status lives on Table cards), guided creation wizard and starting builds (data is in `sheets.json`), vice/downtime rolls, phones (desktop only).
