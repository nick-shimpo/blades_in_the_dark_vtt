# 0005: A compact layout for phones and tablets

**Status:** accepted, 2026-09-14
**Decided by:** Nick

## Decision

1. **Compact mode is a reduced app, not a squeezed one.** On a viewport 1024 px wide or narrower the tabs are **Sheets · References · Dice** only. Play and Network are canvases that need a mouse and a wide screen; Sparks and GM Notes are desk tools. A link to any of those opens Sheets instead.
2. **Dice becomes a view of its own.** It is the same tray that sits beside the Play surface on a desktop, filling the screen: the last roll made anywhere at the table, the six before it, and the fortune roller. Rolls made from a phone's character sheet appear on every other screen exactly as before, because nothing about the roll path changes.
3. **Same URLs everywhere.** A campaign link opens the same way on a phone and a laptop; only the layout differs. The choice is automatic by width, and the ☰ menu offers a manual override (auto, compact, full) remembered per browser, so a tablet in landscape can ask for the full app.
4. **Touch adjustments** in compact mode: the rails become horizontal strips at the top of Sheets and References, sheet bodies flow in one column, inputs are at least 16 px so iOS does not zoom on focus, track boxes and rating dots grow to comfortable hit targets, dialogs fit the width, and the page height follows the dynamic viewport so nothing hides behind browser chrome.

## Consequences

- Compact mode is CSS under one class plus a small hook; the views themselves are unchanged. A future full mobile Play view would be a separate piece of work.
- Rolling from a phone is first-class: the roll dialog is the desktop one, fitted to the width.
- Anything not listed above is intentionally unavailable on a phone rather than half-working.
