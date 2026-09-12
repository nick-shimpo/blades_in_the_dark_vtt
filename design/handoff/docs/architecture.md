# Production architecture recommendation

Goal: the same table for a GM and 3–5 players, hosted on Cloudflare Pages or GitHub Pages, no install. The prototype is single-browser (localStorage + a linked file); production needs a shared document and live updates.

## Shape

- **Static SPA** (Vite + React or Svelte, TypeScript). Route per campaign: `/c/<campaignId>`. Views: Table · Sparks · Play · Sheets, exactly as the prototype's tabs.
- **Reference data** (`data/*.json`, ~500 KB total) is bundled or fetched once and cached; it never changes at runtime.
- **Campaign document** = the ledger (`docs/ledger-schema.md`), one JSON blob per campaign, kept whole. It is small (tens of KB) — no need for a relational schema.
- **Sync**: GitHub Pages is static-only, so live sync needs an external backend either way. Recommended: **Cloudflare Pages + a Worker with one Durable Object per campaign**. The DO holds the ledger, persists it to its storage, and fans out changes over WebSocket. Clients send small ops (`{path, value}` set operations, or the whole ledger for bulk actions like import); the DO applies them in arrival order (last-write-wins per path), bumps `savedAt`, and broadcasts. Optimistic local apply, reconcile on echo. Alternatives with less code: Supabase Realtime (Postgres row per campaign, JSONB column) or Firebase RTDB.
- **Auth/roles**: keep it light. A campaign has a GM secret and a player link (unguessable id). Roles: GM edits everything; players edit their own character sheet and tick clocks/status if the GM allows (flag on the campaign). Enforce in the DO, not only in the UI.
- **Offline / export**: keep *Export a copy* / *Import a copy* / *Paste a ledger* — the JSON is the user's backup, and existing prototype ledgers must import (run the `normalize` migrations on import: legacy two-way edges, missing `sheets`, `bookClocksSeeded`).
- **Dice**: ephemeral, but broadcast roll results to the room as a transient event (not stored) so everyone sees the dice.

## Suggested module layout

```
src/
  data/            loaders + types for book.json, sheets.json, sparks.json, claims-maps.json
  ledger/          schema (zod), normalize/migrate, rules engine (pure functions: see docs/rules-engine.md)
  sync/            DO client, op queue, presence
  table/           canvas (pan/zoom, cards, edges, radial menus, dossier, book picker)
  sheets/          rail, playbook picker, character sheet, crew sheet, roll dialog
  sparks/, play/   ported from the prototype
worker/            Durable Object: ledger store + WebSocket room
```

## Rendering notes for the Table canvas

- World space 4000 × 3000, `translate(pan) scale(zoom)` on one container; zoom 0.25–2.5 around the cursor; FIT computes the bounding box of cards (+24 px) and clamps scale 0.3–1.25.
- Cards are DOM (not canvas) so text is selectable and editable in place; edges are one SVG layer beneath with a 16 px transparent hit stroke for click-to-edit.
- Card height is measured after render (ResizeObserver) because clocks and text change it; the prototype re-centres cards vertically when height changes so edges stay attached.
- Ports: four 11 px dots on card edges, drag from a port to a card (or port) to create an edge, drop target found with `elementFromPoint`.

## Licensing

Ship the attribution required by the CC-BY 3.0 SRD licence in the footer / about screen: "This work is based on Blades in the Dark (found at http://www.bladesinthedark.com/), product of One Seven Design, developed and authored by John Harper, and licensed for our use under the Creative Commons Attribution 3.0 Unported license." Do not bundle the book's art, the official sheet PDFs, or the `ref-*.png` page renders. Fonts used are open (Google Fonts: IM Fell English, IM Fell English SC, Courier Prime, Big Shoulders Stencil, Crimson Pro) — self-host them for the Pages build.
