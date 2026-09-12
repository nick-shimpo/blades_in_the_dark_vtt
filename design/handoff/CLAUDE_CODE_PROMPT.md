# Prompt for Claude Code

Paste this (or your own version) as the first message in the new repo:

> Build a hosted web app from the design handoff in `handoff_doskvol_table/`. Read `README.md`, then `docs/architecture.md`, `docs/ledger-schema.md` and `docs/rules-engine.md` before writing code. The HTML in `reference/` is a working prototype to match, not code to ship — open `reference/Doskvol Table - standalone.html` in Chrome to see every screen; the ☰ menu → "New campaign…" → EXAMPLE SEED gives you a populated table, and `data/ledger.example.json` imports through ☰ → "Paste a ledger…".
>
> Constraints: static SPA deployable to Cloudflare Pages (TypeScript, Vite; React or Svelte), one JSON ledger per campaign kept exactly in the documented shape so existing ledger files import, live multi-user sync via a Cloudflare Worker + Durable Object (WebSocket room per campaign), GM/player roles, and the CC-BY attribution in the footer. Load `data/*.json` as the game content — do not retype rules text. Implement the rules engine as pure functions with tests (the cases in `docs/rules-engine.md`), then the Table view, then Sheets, then Sparks/Play.
>
> Start by proposing the repo layout and the sync protocol, then build the Table view first.

Suggested order of work: data types + ledger normalize/migrate → rules engine + tests → Table canvas → Sheets → roll dialog → Sparks/Play → Worker sync → auth/roles → Pages deploy.
