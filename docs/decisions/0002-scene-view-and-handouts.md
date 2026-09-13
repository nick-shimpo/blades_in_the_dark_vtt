# 0002: The Scene view, and what happens to handouts

**Status:** accepted, 2026-09-13
**Decided by:** Nick, on a review of the Claude Design handover `design/handoff-scene/`

## Context

The second handover adds a fifth view, **Scene**: a fixed 1440 × 810 shared surface for the moment of play, with big progress clocks, index cards for the people, places and events that come up mid-session, and a sweep that clears it between scores. The handover also proposed **handouts**: images anyone at the table could upload, show full-screen to everyone, and remove with the item.

Storing uploaded images needs a blob store. The options were weighed:

- **GitHub API into the repo:** the write token would ship inside the public site, every upload would wait for a Pages deploy, and deleted files would live on in git history. Rejected.
- **Firebase Storage** (the handover's proposal): since October 2024 it requires the pay-as-you-go Blaze plan, which means a billing account on the project.
- **Downscaled images as base64 in the Realtime Database**, in a sibling path deleted atomically with the item: workable within limits (10 MB strings, 16 MB writes), no new component, but a blob store in name only.

## Decision

1. **Build the Scene with clocks and index cards only.** No handouts, no file picker, no drag-and-drop or paste of images, no shared full-screen foreground.
2. **Play assets will be repo-bundled static files** that Nick supplies offline. They get committed, ship with each deploy, and will be presented on a separate screen designed later. No runtime upload path exists in the app.
3. Tabs become **Table · Scene · Sparks · Play · Sheets** on keys 1 to 5.
4. The ledger gains `scene.items` (id-keyed map of clocks and cards). Older ledgers import with an empty scene; exports carry the scene as an array like the other collections. Unknown item kinds (a handout from the prototype's example data) are dropped on import.
5. **Sweep** is a header control on the Scene: first press arms (red button, header hint), second press clears `scene/items`. Esc disarms.

## Consequences

- Nothing in the app accepts a file from a player, so the trust model ("anyone with the link") never extends to storage costs or abuse.
- The Scene's data is small and lives entirely in the ledger; it is swept between scores rather than archived.
- The asset screen, when it comes, is a pure front-end over files in the repo; the only decision left for it is folder layout and an index.
