# Rules engine — derivations and transitions

These are the behaviours the prototype implements in its logic class (`reference/Doskvol Table.dc.html`, methods named here). Re-implement them as pure functions over the ledger document so the UI stays thin and the same code can run on the server for validation. Sources: `docs/source-pack/*.md` (page references inside).

## 1. Table

- **One-line blurb** (`oneLine`): if `node.blurb` is set use it; else derive by type — faction: first sentence of `f.tagline`; npc: `first role · first faction` or first sentence of description; location: first sentence of description, else `type in district`; district: first sentence of summary; crew: `crewType · district`. Truncate at 120 characters on a word boundary with `…`.
- **Status → visuals** (`plate`, `statusBg`): tint per status −3…+3 = `#eed6ca #eedbd0 #efe3d2 #f2ead2 #ebead2 #e3e8d0 #dde5cb`; band/border colour −3…+3 = `#5e1e10 #8c2f1b #9c4a2c #8a7d64 #586b3a #3f6a45 #2d5a3a`; words WAR · HOSTILE · INTERFERING · NEUTRAL · HELPFUL · FRIENDLY · ALLIES. Band shows `+2 · FRIENDLY`, `−1 · INTERFERING`, `NEUTRAL`. Click band = +1, right-click = −1, clamped. Crew card has no band. Districts and locations only show a band when status ≠ 0.
- **Tier → weight** (`plate`): border `1 + 0.5·tier` px, card shadow offset `3 + 0.7·tier` px at alpha `0.26 + 0.04·tier`. Roman numeral shown in the header pill.
- **Clocks**: `tick(+1/−1)` clamps 0…size; full clock gets a red ring. Segment cycle 4→6→8→10→12 (filled clamped to new size). Book clocks: when a faction is placed (or first loaded) its `detail.clocks` become real clocks once (`bookClocksSeeded`), ids `bk-<factionId>-<i>`.
- **Adding from the book**: if a node with the same `ref` already exists, select and centre it instead of adding. New nodes are placed at the right-click point (or scattered around the viewport centre) and `autoLink`ed: structural relations from the book (Leads, Member, Holds, In, Based in, Frequents, Purveys at) become edges to nodes already on the table. **RELATED** lists everything the book links to a node (`relatedOf`) with `+ ADD` / `⤝ LINK` / `✓ LINKED`; adding places the new card on a free spot around the source (`placeNear`, 12 candidate angles at radius w/2+190, scoring distance to existing cards).
- **Edges**: creating an edge that already exists (same from→to) opens that edge's label instead. Label edit opens immediately after drawing. Label tone (tweakable): labels starting `rival|hostile|at war|war|fears|enem|hunts|hates|contests|threat` draw red `#8c2f1b`; `allied|friendly|protects|ally|loves|trusts|shelters` draw green `#3f6a45`; else ink. Parallel edges between a pair fan out in lanes 16 px apart; label sits at the bezier midpoint, pushed out ×1.6 for lanes.
- **Deletion**: two-step. Select → Delete/Backspace or radial REMOVE arms; second press or the red tag confirms. Esc disarms.

## 2. Character sheet

- **Attribute rating** = number of that attribute's four actions with ≥ 1 dot (`attrRating`). Never edited directly; it is the resistance pool.
- **Action cap** (`actionCap`): 3, or 4 when the crew's Mastery upgrade has all 4 boxes. (Creation cap of 2 is not enforced.) Clicking dot *i* sets the rating to *i+1*, clicking the current rating lowers it by one.
- **Stress max** (`stressMax`): 9 +1 Survivor ability +1 if crew has Composed or Steady fully bought (3 boxes), max 12.
- **Stress → trauma** (`setStress`): marking the last box sets stress 0, trauma +1 (clamped to trauma max), and flags "choose a condition" until a condition is ticked or Esc. Trauma max 4, or 5 with Hardened/Ordained (3 boxes). At max the hint reads "four trauma — retire or take the fall".
- **Harm** (`takeHarm`): clicking level *L* finds the first empty cell in row *L*; if the row is full it moves up to *L+1*; if level 3 is full → **fatal** banner. Recording harm clears the healing clock (to 1 with Vigorous). Penalty labels: 3 NEED HELP · 2 −1D · 1 REDUCED EFFECT; with Tough as Nails they shift down one level (−1D · REDUCED EFFECT · —).
- **Healing clock** (`healTick`): 4 segments; Vigorous permanently fills one (minimum 1). Filling it moves every injury down a level (row 3 → row 2, row 2 → row 1, row 1 cleared; each row keeps at most its cell count) and resets the clock.
- **Armor**: three boxes; *special* is disabled unless a ticked ability (own or veteran) is one of `battleborn focused fortitude shadow subterfuge mastermind warded`. "restore" clears all three (downtime).
- **Load** (`loadLimits`, `loadUsed`): limits light 3 / normal 5 / heavy 6 (Mule: 5 / 7 / 8). Used load = sum of `load` of ticked items; 0-load items are italic, free, and drawn with a round box. Multi-load items fill all their boxes together. Over the limit the counter turns red — allowed, not blocked.
- **XP** (`setXp`): playbook track 8, attribute tracks 6. Filling a track clears it and increments `advances[track]`; an `ADVANCE ×n` badge appears (playbook: new ability; attribute: +1 dot). The player makes the change and clicks the badge to spend it.
- **Stash**: 40 boxes in rows of 10; lifestyle = full rows (0 street life · 1 poor · 2 meager · 3 modest · 4 fine). `2 STASH → 1 COIN` (needs stash ≥ 2 and coin < 4); `1 COIN → STASH`.
- **Veteran**: any ability from another playbook may be added; listed with a `VETERAN · PLAYBOOK` tag and removable; counts for all ability checks above.
- **Friends / contacts**: ▲ close friend, ▼ rival, mutually exclusive per NPC.

## 3. Rolls (dialog)

- **Action roll**: pool = action dots + 1 (push *or* devil's bargain, never both) + 1 (assist). Pool 0 → roll 2d and keep the **lowest**, no critical possible. Otherwise result = highest die; two or more 6s = critical. Outcome text by position (controlled / risky / desperate) × result (crit / 6 / 4–5 / 1–3) is in `OUTCOMES` in the prototype (book p. 19). Effect (limited / standard / great) is appended for information.
- **Applied automatically on roll**: push +1d → 2 stress; push +1 effect → 2 stress (both allowed together); assist → the chosen teammate takes 1 stress; desperate position → 1 xp in the action's attribute (with track fill → advance). Stress applied through `setStress`, so it can trigger trauma.
- **Resistance roll**: pool = attribute rating (0 → 2d lowest). Stress taken = 6 − highest; critical clears 1 stress instead.
- Dice results are ephemeral — never written to the ledger.

## 4. Crew sheet

- **Turf** (`turfCount`) = held `turf` tiles + wanted level if Fiends is ticked + number of factions on the table at status +3 if Accord is ticked; capped at 6.
- **Rep tracker**: 12 boxes; the rightmost *turf* boxes are hatched and not clickable; rep needed = max(6, 12 − turf). When rep ≥ needed a DEVELOP button appears: weak hold → strong hold, rep 0; strong hold → tier +1, hold weak, rep 0, label shows the cost `newTier × 8 coin` (not deducted — it comes from PC stashes too).
- **Heat** (`setHeat`): 9 boxes; marking the 9th sets heat 0 and wanted +1 (max 4). Wanted boxes are directly editable (red).
- **Coin capacity** (`coinCap`): 4 · 8 with one Vault box · 16 with two.
- **Crew xp** (`setCrewXp`): 8 boxes; filling clears and adds an unspent advance (`ADVANCE ×n · ABILITY or 2 UPGRADES`; tooltip reminds to pay each PC stash +1, +2 per Tier).
- **Upgrades**: crew-specific list first (bold) then the general list; each has `boxes` cost; click box *i* fills up to *i+1*. Choosing a crew type pre-fills its starting upgrades (`pickCrewType`): `Training: X` → `training_x` 1; `Cohort: Gang, type T` → a gang cohort of type T; `Lair: Secure` → `secure_lair` 1; `Lair: Hidden` → `hidden_lair` 1; `Vehicle` → `boat_house` 1. It also writes the crew type into the Table crew card (`f.crewType`).
- **Cohorts**: gang quality = tier, scale = tier; expert quality = tier + 1, scale 0; ELITE when an `elite_<type>` upgrade is bought for one of its types. Max 2 types, 2 edges, 2 flaws. Harm 1 Weakened (reduced effect) · 2 Impaired (−1d) · 3 Broken (can't act) · 4 Dead.
- **Claims** (`claimPath`): 3 × 5 grid from `data/claims-maps.json` (`tiles`, `hub`, `connections` as `[[row,col],[row,col]]`). Only listed pairs draw a connector. A held tile that cannot reach the lair through held tiles along connectors is **off-path**: dashed red border (allowed, flagged). Connectors between two held tiles (lair counts) draw ink; others `#c9bd9d`. Hovering shows the tile's benefit text; clicking toggles held.
- **Change crew type** is two-step (arm, confirm) and resets type, abilities, upgrades, claims, contacts, cohorts.

## 5. Cross-links between Table and Sheets

- Crew name: one field (`ledger.crew.name`), edited from the header, the Table crew card and the crew sheet band.
- Crew tier on the Table crew card = `sheets.crew.tier` once a crew type is chosen; the card's own `tier` is only used before that.
- Accord counts +3 factions from Table nodes. (A full faction-status list was deliberately left out: status lives on the Table cards.)
