# Phase 2 — Retention Hooks

Requires Phase 1 (persistence layer) to be complete first.

---

## 2.1 Streak Tracking

- [ ] On session complete, write today's date to persistence and increment streak counter
- [ ] On app load, check if yesterday was played; if not, reset streak to 0
- [ ] Display current streak somewhere visible (end screen, and optionally HUD)
- [ ] Track longest streak all-time as a separate stat

## 2.2 Personal Stats

Stats to track per session and accumulate all-time:

- [ ] Solve time (start timer on first interaction, stop on session complete or game over)
- [ ] Lives used (derived from 3 minus lives remaining at end)
- [ ] Hints taken (count calls to the hint system in `src/stores/useHint.ts`)
- [ ] Sessions played, sessions completed (all 8 levels)
- [ ] Display stats on the end screen
- [ ] Consider a dedicated stats view (accessible from end screen or a persistent menu icon)

## 2.3 Shareable Daily Result Card

The viral loop. Spoiler-free — shows outcome shape, not puzzle content.

- [ ] Define the result format: an 8-cell row of symbols showing pass/fail/lives-used per level (similar to Wordle's emoji grid)
- [ ] Generate the share text string (e.g. "Boxle 2026-04-22 ⭐⭐⭐💀⭐⭐⭐⭐ 3:42")
- [ ] Add a "Share" button to the end screen that calls `navigator.share()` with fallback to clipboard copy
- [ ] Test on desktop (clipboard) and mobile (native share sheet)
