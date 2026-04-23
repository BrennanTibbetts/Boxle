# Phase 1 — Foundation

Prerequisites for everything else. Nothing in Phase 2+ is buildable without this.

---

## 1.1 Persistence Layer (localStorage)

The single most blocking gap. All other features (streaks, stats, unlock state) read/write through this.

- [x] Design the storage schema: what keys, what shape (daily progress, stats, streaks, unlock state)
- [x] Create `src/stores/usePersistence.ts` — Zustand store with `persist` middleware; hydrates from localStorage automatically
- [x] Save and restore daily puzzle progress (level, lives, board state, phase) — keyed to today's date
- [x] Guard against stale data: `loadDaily()` returns null if stored date != today; all-time stats always accumulate
- [x] Create `src/hooks/usePersistenceSync.ts` — subscribes to game state changes and syncs to persistence; detects new session vs. restore
- [x] Stats tracked: totalSessions, totalCompleted, bestTimeMs, totalHints, totalLivesLost, currentStreak, longestStreak

## 1.2 Remove Leva Debug Panel

Leva is currently visible to end users. Must be stripped before any public link is shared.

- [x] Gate `<Leva>` in `src/index.tsx` behind `import.meta.env.DEV` — panel hidden in production builds, fully accessible in localhost
- [ ] Verify the panel does not appear in a `vite build` + preview

## 1.3 Session Complete / Game Over Screen

The `ENDED` phase in `src/stores/useGame.ts` currently has no UI. Players just stare at a frozen board.

- [x] Fix `placeStar` in `useGame.ts` — session complete (all 8 levels done) now triggers `Phase.ENDED`; was previously undetected
- [x] Fix `lives` on game over — was incorrectly reset to 3 at the ENDED moment; now stays at 0 so end screen can distinguish outcomes
- [x] Fix `restart` — now resets board state to blank, resets timer, goes straight to PLAYING (previously went to READY with no handler)
- [x] Build `src/interface/EndScreen.tsx` — 2D overlay showing levels completed, elapsed time (session complete) or a "Try Again" button (game over)
- [x] Wire it into `src/interface/Interface.tsx`
