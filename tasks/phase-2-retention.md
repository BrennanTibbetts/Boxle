# Phase 2 — Retention Hooks

Requires Phase 1 (persistence layer) to be complete first.

---

## 2.1 Streak Tracking

- [x] On session complete, write today's date to persistence and increment streak counter
- [x] On app load, check if yesterday was played; if not, reset streak to 0
- [x] Display current streak on end screen
- [x] Track longest streak all-time as a separate stat

## 2.2 Personal Stats

Stats to track per session and accumulate all-time:

- [x] Solve time (start timer on first interaction, stop on session complete or game over)
- [x] Lives used / mistakes tracked per session and accumulated all-time
- [x] Hints taken (wired in HUD.tsx → usePersistence.recordHint + useGame.incrementSessionHint)
- [x] Sessions played, sessions completed (all 8 levels)
- [x] Display stats on the end screen (levels, time, hints, mistakes)
- [x] Dedicated stats view (`StatsModal.tsx`) — streak, win rate, best time, hints, mistakes; triggered from Stats button on end screen; backdrop click to dismiss

## 2.3 Shareable Daily Result Card

The viral loop. Spoiler-free — shows outcome shape, not puzzle content.

- [x] Define the result format: 8-box emoji grid — 🎯 clean, 🟡 with mistakes, 💀 game over, ⬜ not reached
- [x] Generate the share text string: date header, emoji grid, streak line
- [x] "Share" button on end screen: clipboard copy + "Copied!" feedback (web/desktop only for now; mobile native share is out of scope until platform strategy shifts)

---

## Deferred follow-ups

- [ ] **Real sharing surface** — when we're ready to push for virality, revisit: `navigator.share()` wiring for mobile, OG preview images on the shared URL, proper Twitter/Bluesky/iMessage link previews. Tracked here so we don't forget once mobile is in the picture.
