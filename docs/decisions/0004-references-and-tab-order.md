# 0004: The References page, GM Notes, and the tab order

**Status:** accepted, 2026-09-13
**Decided by:** Nick

## Decision

1. **Tab order is Play · Sheets · References · Network · Sparks · GM Notes.** "Tools" is renamed **GM Notes** and is shown, and reachable, only on the GM link; a player who types its URL lands on Play. Play is the default view, so the bare campaign link opens the live table. Keyboard keys 1 to n follow each role's visible tabs.
2. **A References page.** A left sidebar lists reference sheets as a thumbnail with a label; clicking one shows it in the main panel. Two kinds of entry:
   - **Built sheets**, written in the app's own style from the rulebook's rules text (the same material the official player reference kit distils): action roll, position and effect, consequences and resistance, teamwork, planning and engagement, downtime, advancement and the faction game, the twelve actions, gathering information. Text is SRD content under CC-BY.
   - **Image assets**, static files committed under `public/references/` and listed in a small manifest. They ship with each deploy and are never uploaded at runtime (decision 0002). The first intended asset is the official Doskvol city map.
3. Selection on the References page is local to each viewer; it is a lookup surface, not a shared one.

## Consequences

- Adding a reference image is a two-step change in the repo: drop the file in `public/references/` and add a manifest line. No database, no upload.
- The repository is public. Committing the publisher's artwork (the map) publishes it to anyone who finds the repo; the rules text is licensed for this, the art is not. Nick decides per asset whether that is acceptable; until an asset is committed the manifest entry simply does not render.
- The official player kit could not be fetched from the build machine (the publisher's sites are blocked on that network). The built sheets therefore follow the book directly; the kit can be compared side by side later if Nick supplies it.

## Revision 2026-09-14

Nick supplied the official **Player Kit v8.2** and asked for its pages to replace the sheets built from the rules text. The References rail now shows six kit pages as images (1 simple rules overview, 26 and 27 rules reference, 28 GM reference, 11 standard items and vice purveyors, 22 the Doskvol map with landmarks and districts), rendered from the PDF into `public/references/`. The built sheets and their tests were removed; the view still supports component sheets should they be wanted again. The separately registered map placeholder is superseded by kit page 22.
