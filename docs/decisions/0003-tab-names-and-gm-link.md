# 0003: Tab names, and a GM link that is not a login

**Status:** accepted, 2026-09-13
**Decided by:** Nick

## Decision

1. **Tabs are renamed.** Table → **Network**, Scene → **Play**, Play → **Tools**. Sparks and Sheets keep their names. Order and keys are unchanged: Network 1, Play 2, Sparks 3, Tools 4, Sheets 5. The folders under `src/views/` keep their original names (`table`, `scene`, `play`); the view ids in `src/ui/context.ts` and the URL segments use the new names, and the old segments `table` and `scene` still open the right view.
2. **Two links per campaign, no authentication.** `#/c/<id>` is the player link, `#/gm/<id>` the GM link. The role is nothing more than which prefix the browser used; anyone who knows the pattern can open the GM link. This is deliberate: the group is friends, and the point is a cleaner player screen, not access control. The ☰ menu offers both links. A new campaign opens on the GM link.
3. **First GM-only feature:** progress clocks on the Network view are hidden from players: not shown on cards, not offered in the radial menu, not shown in the dossier. The data is untouched, so a player who opens the GM link sees them. The Play view's big clocks remain visible to everyone; they are the table's shared clocks.

## Consequences

- Role reaches every view through `useLedger().role`. Views add role checks only where Nick asks for a difference; the default is that GM and players see the same thing.
- Recent campaigns remembered by a browser keep the GM flag once it has been used there, so the home page reopens the campaign with the right link.
- Because the split is cosmetic, nothing in the database rules changes.
