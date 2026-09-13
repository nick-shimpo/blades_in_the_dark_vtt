# Handoff: Scene — a fifth view for Doskvol Table

## Overview

**Scene** is the shared tabletop for the moment of play in Doskvol Table (the Blades in the Dark VTT in this repository). Everyone with the campaign link sees the same surface, live: very visible progress clocks, index cards thrown down for the people, places and events that come up mid-session, and handouts (maps, letters) that anyone can put in front of the whole table. It sits next to the **Table** as a second canvas — the Table is the campaign's memory; the Scene is *right now*.

Design brief from the GM: as simple and lean as the rest of the app — no sidebars, minimal clicks, no explanatory text, clean effortless play. Both GM and players use it.

## About the design files

`Scene.dc.html` is a **design reference created in HTML** — a working prototype showing the intended look and behaviour (it needs `support.js` next to it; open it in Chrome). It is not production code to copy. The task is to **recreate it inside the existing codebase** (Vite + Preact + TypeScript, `src/views/*`, CSS files per view, tokens in `src/styles/tokens.css`) using the app's established patterns: the `useLedger()` API and per-path `update()` patches, the existing `Clock`, `RadialMenu`, header hint (`setHint`), `inControl` / `isTyping` helpers, and the `.tbl` canvas styles. Where this README and the prototype disagree, the prototype wins.

## Fidelity

**High-fidelity.** Colours, type, spacing, component shapes and interactions are final and follow the app's existing "Ink Ledger" tokens. Recreate them exactly.

## Placement

- Header tabs become **Table · Scene · Sparks · Play · Sheets**, keys 1–5 (`VIEWS` in `src/ui/context.ts`, route `#/c/<id>/scene`). Appending Scene as key 5 instead is acceptable if remapping the existing keys is unwanted.
- Header controls while on Scene: only **SWEEP** (styled like FIT: Courier Prime 700, 11 px, 1 px tracking, `padding 5px 10px`, paper-light button). Two-step: first click arms — the button takes the red `.book` treatment (`#8c2f1b` background, `#f2ead2` text, `1px 1px 0 #221c13` shadow) and the header hint reads `sweep the scene? click SWEEP again · esc keeps it`; second click clears every item and the foreground. `Esc` disarms. FIT and BOOK stay Table-only.
- Roll ticker and ☰ menu are unchanged and still show on Scene.

## Ledger additions (`src/ledger/types.ts`)

```ts
interface Ledger { …; scene: { items: Record<string, SceneItem>; foreground: string | null } }

type SceneItem = { id: string; kind: 'clock' | 'card' | 'handout'; x: number; y: number; createdAt: number } & (
  | { kind: 'clock'; name: string; size: 4 | 6 | 8 | 10 | 12; filled: number }
  | { kind: 'card'; type: 'npc' | 'location' | 'other'; title: string; body: string }
  | { kind: 'handout'; src: string; caption: string; ratio?: string }   // ratio: "w / h" of the image
);
```

- `x, y` are the item's **top-left in table units**. The table is a fixed **1440 × 810** surface, scaled uniformly to fit each viewer's view (`s = min(vw / 1440, vh / 810)`, centred in the remaining space) — so every browser shows the same arrangement, no pan or zoom.
- `scene/foreground` is shared state: setting it opens that handout full-screen for **everyone**; clearing it closes it for everyone.
- Writes are per-path patches like the rest of the app: `scene/items/<id>/filled`, `scene/items/<id>/x`, `scene/items/<id>` (null to remove), `scene/foreground`. Sweep writes `scene/items: {}` and `scene/foreground: null`.
- Handout `src`: the Realtime Database is not for blobs — put files in Firebase Storage under `campaigns/<id>/handouts/<itemId>` and store the download URL (a data URL is acceptable for small files in local mode). Export/import: carry `scene` in the v1 file as arrays like the other collections (`normalize.ts`).
- Anyone with the link can add, move, show and sweep — the app's trust model. No roles.

## Screen: Scene

**Purpose.** A live surface to add clocks, index cards and handouts during play; everything is shared.

**Layout.** Standard app frame: header (46 px, `4px double #221c13` rule) above a `.view` that the Scene fills (`position: absolute; inset: 0; overflow: hidden`). Surface background is the Table's dotted grid: `radial-gradient(rgba(34,28,19,0.14) 1px, transparent 1px)`, `background-size: 26px 26px`, `user-select: none; touch-action: none`, cursor default. Inside it a `1440 × 810` world div with `transform-origin: 0 0; transform: translate(ox, oy) scale(s)`; items are absolutely positioned children of the world (`cursor: move`; z-index 2, selected item 5). The radial menu is positioned in **canvas pixels** outside the world transform, so it never scales.

### Clock item (element width `max(200, dial + 24)`)

- Column, centred, `gap: 8px`.
- **Dial**: 150 px (prototype tweak allows 120–200; 150 is the default), `border-radius: 50%`, `3px solid #221c13`, face `conic-gradient(#8c2f1b 0deg → filled·seg deg, #f6efdb → 360deg)` under dividers `repeating-conic-gradient(from -1deg, #221c13 0deg 2deg, transparent 2deg → seg deg)` (`seg = 360 / size`). Shadow `2px 2px 0 rgba(34,28,19,0.25)`; when full `0 0 0 4px rgba(140,47,27,0.35)`. Selected adds a leading `0 0 0 2px #221c13` ring (red `#8c2f1b` when armed for deletion). It is a real `<button>`: click ticks +1, right-click or shift-click ticks −1 (and stops propagation so the radial does not open). Dragging the dial moves the clock; a drag never ticks (suppress the click that follows a moved drag).
- **Name**: IM Fell English 22 px / 1.15, centred, `text-wrap: pretty; overflow-wrap: anywhere`, `padding 0 4px`, `cursor: text`, red when full. Click → 2-row `<textarea>` in the same type, `background rgba(255,250,235,0.6)`, `1px solid #8c2f1b`, `padding 2px 5px`, autofocused; Enter / Esc / blur commits (newlines become spaces).
- **Control row** (`display: flex; gap: 8px`, centred): `−` button · count · `+` button. The `±` buttons are the Table card's: 30 × 24, `1px solid currentColor`, transparent, Courier Prime 700 15 px; `−` at 75 % opacity, hover → ink background / paper-light text; `+` hover → red background and border, paper-light text. Count `2 / 6` in Courier Prime 700 13 px, 1 px tracking, no border, red when full; click cycles the size 4 · 6 · 8 · 10 · 12 (filled clamps to the new size).
- New clock: `name "New clock", size 6, filled 0`, top-left at click point − (100, 90), selected, name opened for editing.

### Index card item (300 wide)

- Box `#f2ead2`, `1px solid #221c13`, shadow `4px 4px 0 rgba(34,28,19,0.28)`, **square corners** (Table cards are 14 px rounded; index cards deliberately are not). Selected → `0 0 0 2px #221c13` ring (red when armed).
- **Head**: `display: flex; align-items: baseline; gap: 8px; padding: 10px 14px 6px; border-bottom: 2px solid #8c2f1b` (the index card's red top rule).
  - Type glyph button: ♟ person (`npc`) · ⌖ place (`location`) · ✦ event/feature (`other`); 15 px, no border, 70 % opacity (100 % on hover); click cycles npc → location → other.
  - Title `<input>`: IM Fell English SC 21 px / 1.05, transparent, no border, placeholder `name` in `#9a8d70`.
- **Body** `<textarea>`: IM Fell English 16 px, `line-height: 26px`, `padding: 0 14px; margin: 6px 0 12px`, transparent, no border, `resize: none`, min 4 lines (`min-height: 104px`) and grows with content (`field-sizing: content`, fallback `rows=4` + auto-grow). Ruled lines: `background: repeating-linear-gradient(to bottom, transparent 0 25px, rgba(34,28,19,0.16) 25px 26px)`.
- New card: `type 'other', title '', body ''`, top-left at click point − (150, 80), title focused.
- **TO TABLE** (radial): create a Table node (`addCustomNode` pattern) with `type` from the glyph, `name` = title, `notes` = body, placed near the crew card; remove the card from the Scene; flash the header hint `<title> moved to the Table` for 2.5 s.

### Handout item (320 wide)

- Mount `#f2ead2`, `1px solid #221c13`, shadow `4px 4px 0 rgba(34,28,19,0.28)`, `padding 8px 8px 6px`. Selected ring as the card.
- **Picture**: a `<button>` (`display: block; width: 100%; padding: 0; border: 1px solid rgba(34,28,19,0.35); background: #e7dfc9; cursor: zoom-in; overflow: hidden`) containing the image at `width: 100%`, aspect ratio of the file (`ratio`), `max-height: 380px`, cover. Click → show to the table (set `scene/foreground`). Dragging the picture moves the handout; a drag never opens it.
- **Caption row**: `display: flex; align-items: baseline; gap: 8px; padding: 8px 4px 2px`: caption `<input>` (IM Fell English italic 15 px, transparent, no border, placeholder `caption`) + `⤢` button (15 px, no border, 50 % opacity → 100 % on hover) that also shows it.
- New handout: from the radial's HANDOUT (file picker; lands at the right-click point − (160, 120)), from dropping an image file onto the surface (lands at the drop point) or pasting an image while not typing (lands at the table centre). Caption defaults to the file name without extension (`Pasted handout` for paste).

### Foreground (shared overlay)

- `position: fixed; inset: 0; z-index: 100; background: rgba(34,28,19,0.78)`; column, centred, `gap: 16px; padding: 48px 40px`.
- Frame: `#f2ead2`, `2px solid #221c13`, shadow `8px 8px 0 rgba(34,28,19,0.35)`, `padding 10px`, image contained within `min(1100px, 92vw − 24px) × min(700px, 82vh − 24px)`.
- Caption under the frame: `#e7dfc9`, IM Fell English italic 18 px, centred.
- `✕` close: top 12 px / right 16 px, 34 × 30, no border, `#e7dfc9` at 75 % (100 % hover), 18 px.
- Click the scrim, `✕` or `Esc` clears `scene/foreground` — for everyone.

### Radial menu (reuse `RadialMenu.tsx` unchanged)

Dashed ring r = 76 (`1px dashed rgba(34,28,19,0.5)`), 8 px ink dot at the click point, 48 px round paper-light buttons (`1px solid #221c13`, `2px 2px 0 rgba(34,28,19,0.28)`, 18 px glyph; hover ink background / paper glyph; danger items red border + glyph, hover red background / paper-light glyph), Courier 9 px labels (1.5 px tracking, 92 px wide, `rgba(231,223,201,0.85)` backing) 46 px outside the ring. Items start at 12 o'clock and are spaced evenly.

- Empty surface: **◔ CLOCK · ▭ CARD · ▣ HANDOUT** (HANDOUT opens a file picker; the item lands at the click point).
- On a clock: **↺ RESET** (filled → 0) · **✕ REMOVE** (danger; arms).
- On a card: **⤢ TO TABLE · ✕ REMOVE**.
- On a handout: **⤢ SHOW · ✕ REMOVE**.

### Selection, arming, removal

- Click an item (pointer down + up without moving 4 px) → selected.
- `Delete` / `Backspace` (not while typing, no foreground open) arms; again removes. Radial REMOVE arms. Armed: ring turns red, a red tag appears under the item — `✕ REMOVE — CLICK TO CONFIRM · ESC` (Courier Prime 700 10 px, 1.5 px tracking, `#8c2f1b` background and border, `#f2ead2` text, `padding 4px 10px`, `2px 2px 0 rgba(34,28,19,0.3)`, centred 30 px below the item; hover `#a63a22`) — and the header hint reads `remove this clock|card|handout? click the red tag or press ⌫ again · esc keeps it`. Clicking the tag removes.
- Click empty surface → deselect (and close an open radial).
- Double-click empty surface → new index card at that point.

## Interactions & behaviour summary

- Drag any item (4 px threshold) → moves it; write `x, y` on pointer-up like the Table. Everyone sees the move live via the ledger subscription.
- `Esc` closes the innermost thing, in this order: text edit (blur) → radial → foreground → sweep armed → selection.
- Keys 1–5 switch views when not typing (existing behaviour, extended).
- Hover states are colour-only, no animation anywhere (consistent with the app).
- All controls are real `<button>` / `<input>` / `<textarea>` elements; `inControl(target)` should exempt the dial and the handout picture (`data-grab`) so drags can start from them.

## State

- Shared (ledger): `scene.items`, `scene.foreground`.
- Local UI only: selection id, armed flag, open radial (canvas x/y, world x/y, target id), editing id (clock name / new card title), sweep-armed flag, flash hint text, in-progress drag, measured view size for the scale.

## Design tokens used (all from `src/styles/tokens.css`)

- Colours: paper `#e7dfc9`, paper-light `#f2ead2`, paper-hover `#fff6dd`, clock-face `#f6efdb`, ink `#221c13`, red `#8c2f1b`, red-hover `#a63a22`, muted `#5c503b`, faint `#9a8d70`; hairlines `rgba(34,28,19,0.35)`; placeholder stripes (prototype only) `repeating-linear-gradient(135deg, #ddd3b8 0 6px, #e7dfc9 6px 12px)`.
- Type: IM Fell English SC (tabs 15/2 px tracking, card titles 21), IM Fell English (clock names 22, card body 16/26 px, captions 15 italic, foreground caption 18 italic, hints 14 italic), Courier Prime 700 (SWEEP 11, counts 13, radial labels 9, armed tag 10), Big Shoulders Stencil Text 800 (roll ticker only).
- Shadows: hard offsets only — items `4px 4px 0 rgba(34,28,19,0.28)`, dial `2px 2px 0 rgba(34,28,19,0.25)`, radial buttons `2px 2px 0 rgba(34,28,19,0.28)`, foreground frame `8px 8px 0 rgba(34,28,19,0.35)`, selection ring `0 0 0 2px`.
- Radii: dial and radial buttons 50 %; everything else square.

## Assets

None. Glyphs are Unicode (◔ ▭ ▣ ↺ ⤢ ✕ ♟ ⌖ ✦). Fonts are the app's existing Google Fonts link. The striped rectangles in the prototype are placeholders for user-uploaded handout images.

## Not in this pass

Roles or ownership, attaching a Scene clock to a Table card, drawing or annotating on handouts, text-only handouts, pan/zoom of the Scene.

## Files

- `Scene.dc.html` — the interactive prototype (template + logic; tweaks: clock diameter, ruled cards, roll ticker on/off).
- `support.js` — the prototype's runtime; keep it beside the HTML to open it.
