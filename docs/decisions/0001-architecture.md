# 0001: Hosting, storage and codebase shape

**Status:** accepted, 2026-09-12
**Decided by:** Nick, on a review of the Claude Design handover in `design/handoff/`

## Context

The prototype (`design/handoff/reference/`) is a single-browser app: one JSON "ledger" per campaign in localStorage, optionally mirrored to a local file. It has to become something a GM and three to five friends use at the same time from different machines. The handover recommends Cloudflare Pages plus a Worker and a Durable Object per campaign with a WebSocket op protocol, GM and player roles, and a full TypeScript rewrite.

Nick's constraints: the fewest components possible, no authentication, no permissions, GitHub Pages if at all possible, no database if at all possible. The audience is one table of friends.

## Decision

1. **Static site on GitHub Pages, from a public repository.** GitHub Free only publishes Pages from public repos. Nothing secret lives in the repo: campaign data is in the database, the Firebase web config is public by design, and the game text is SRD content under CC-BY.
2. **Firebase Realtime Database is the one managed dependency.** It holds the ledgers and pushes live updates to every open browser through the client SDK. There is no server code of ours anywhere. Multi-user persistence is impossible from static hosting alone, and this is the smallest reliable way to add it.
3. **No accounts.** A campaign lives at `#/c/<random id>`. The database rules allow read and write under `/campaigns/<id>` for anyone who has the link. Anyone with the link is a player. This is the trust model of a game night.
4. **Lean rewrite: Vite, Preact, TypeScript.** The prototype runs on a design-tool runtime that compiles JSX in the browser with Babel fetched from a CDN on every load; it is a reference, not a product. The rewrite keeps the handover's design (colours, type, components, interactions), its data files, its rules engine specification and its ledger format for import and export. Dropped from the handover: the Worker and Durable Object, the op protocol, presence, roles and secrets, the schema library. Tests cover the rules engine only.
5. **Ledger stored as id-keyed maps, exported as arrays.** Concurrent editing needs per-item write paths, so nodes, edges, characters, cohorts and clocks are maps keyed by id in the app and in the database. Import and export convert to and from the array shape documented in `design/handoff/docs/ledger-schema.md`, so ledgers from the prototype load and our exports open in the prototype. Ids are random, not minted from a shared counter, so two browsers cannot collide.
6. **Local mode when no database is configured.** Without a Firebase config the app keeps the ledger in localStorage exactly like the prototype. This is the development mode and a fallback for solo use.

## Consequences

- Deploy is `git push` to `main`; a GitHub Actions workflow builds and publishes.
- One-time setup outside the repo: a Firebase project with a Realtime Database, the web app config pasted into `src/sync/firebase-config.ts`, and the rules from `docs/firebase-rules.json` applied in the console.
- Anyone who obtains a campaign link can edit or wreck that campaign. Export a copy regularly; the ☰ menu keeps Export, Import and Paste for that reason.
- Dice rolls are shared as a short rolling list under the campaign so everyone sees them; they are not part of the exported ledger.
- Out of scope, as agreed in the handover: spirit playbooks, prison claims, a separate faction status list, a creation wizard, vice and downtime rolls, phone layouts.
