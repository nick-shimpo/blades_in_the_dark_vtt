# Doskvol Table

A shared virtual tabletop for one *Blades in the Dark* campaign: a pan-and-zoom map of factions, people and places with clocks and relationships (Network), a live surface of big clocks and index cards for the moment of play that is swept between scores (Play), interactive character and crew sheets with the rules wired in (Sheets), GM spark tables (Sparks), and a play reference (Tools). Built for one GM and a few friends playing online together.

Live at **https://nick-shimpo.github.io/blades_in_the_dark_vtt/**

## How it works

- A campaign has two links: the player link `#/c/<random id>` and the GM link `#/gm/<random id>`. Either is the only key: whoever has it can read and edit. The GM link is not a login, just a slightly different screen (for now: progress clocks on the Network are GM-only). Share the player link with your players, keep both out of public places.
- Everything a table changes is one JSON document, the **ledger**. It is stored in a Firebase Realtime Database and pushed live to every open browser. Without a Firebase config the app keeps the ledger in the browser's localStorage instead (local mode).
- The ☰ menu exports and imports ledgers as `.ledger.json`, in the same shape the original prototype used, so files move both ways.
- No accounts, no roles, no server code of ours, and no file uploads. See `docs/decisions/` for why.

## Develop

```
npm install
npm run dev        # http://localhost:5173/blades_in_the_dark_vtt/
npm test           # rules engine + ledger tests (vitest)
npm run typecheck
npm run build      # dist/
```

Stack: Vite 6, Preact, TypeScript. Node 18 or newer.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds and publishes `dist/` to GitHub Pages.

## One-time Firebase setup

1. In the [Firebase console](https://console.firebase.google.com/) add a project (Analytics off).
2. Build → Realtime Database → Create database → start in locked mode.
3. Rules tab → paste `docs/firebase-rules.json` → Publish.
4. Project settings → Your apps → add a Web app → copy the config object into `src/sync/firebase-config.ts`.
5. Commit and push. The web config is public by design; access is governed by the rules.

## Repository layout

```
src/data/        bundled game content (book, sheets, sparks, claims maps) + typed access
src/ledger/      ledger types, blank documents, import/export, rules engine, tests
src/sync/        store interface, local adapter, Firebase adapter
src/ui/          context, hash routing
src/views/       table, scene, sheets, sparks, play
design/handoff/  the Claude Design handover: prototype, docs, data, source pack
design/handoff-scene/  the second handover: the Scene view
docs/            decisions, Firebase rules
```

## Licence and attribution

This work is based on Blades in the Dark (found at http://www.bladesinthedark.com/), product of One Seven Design, developed and authored by John Harper, and licensed for our use under the Creative Commons Attribution 3.0 Unported license. The application code is the author's own; the book's artwork and official sheet PDFs are not included.
