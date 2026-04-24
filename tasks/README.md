> ## ⚠ READ FIRST — Execution Status (as of 2026-04-23)
>
> **Current position: Phase 3 framework built, tutorial content iterating.**
>
> | Phase | Status | Notes |
> |-------|--------|-------|
> | Phase 1 — Foundation | ✅ **Complete** | All persistence / end-screen / prod-build work done. |
> | Phase 2 — Retention | ✅ **Complete** | Streaks, per-session + all-time stats, shareable result card all shipped. |
> | Phase 3 — Onboarding | 🟡 **In progress** | Framework complete: mode-provider architecture (`src/modes/*`), tutorial controller with info/system/player steps, 3-level walkthrough (4×4/5×5/6×6), first-visit modal. Content iterating — scripts are being refined based on playtest feedback; need a first-time-player validation pass. |
> | Phase 4 — New Modes | 🔲 Not started | Infrastructure ready — follow the existing `ModeProvider` pattern for Arcade and Library. |
> | Phase 5 — Monetization | 🔲 Not started | Blocked until Phase 4. |
> | Phase 6 — Leaderboard | 🔲 Not started | Blocked until Phase 5. |
>
> **Open bug (unblocking):** Mobile drag-mark doesn't flip the initial pointer-down box (works on desktop). Logged in `bugs.md`. Non-blocking, but fix before any public share.
>
> **Key new files from Phase 3:**
> - `src/modes/DailyModeProvider.tsx`, `src/modes/TutorialModeProvider.tsx` — per-mode puzzle loading + persistence
> - `src/stores/useTutorial.ts` — tutorial state (stepIndex, hand position, valid boxes, awaitingContinue)
> - `src/tutorial/TutorialController.tsx` — async script runner with guided (`click`/`placeBoxle`) and auto (`autoMark`/`autoBoxle`) move types
> - `src/tutorial/tutorialScripts.ts` — step sequences per level
> - `src/tutorial/TutorialOverlay.tsx` — colored-text prompt bubble matching HUD styling
> - `src/tutorial/TutorialHandInScene.tsx` — 3D hand cursor via `@react-three/drei` `Html`
>
> **Design conventions locked in during Phase 3** (apply to all future tutorial/hint content):
> - Regions referenced by color, using exact `COLOR_LABELS` values from `src/interface/HUD.tsx`
> - Rows/columns described spatially ("leftmost column", "bottom row") — never 0-indexed
> - Styling matches in-game HUD (Bebas Neue, translucent-glass bubble)
> - Use `autoMark`/`autoBoxle` for concept-teaching demos; use `click`/`placeBoxle` (user-executed) when the teaching is about the interaction itself

# Boxle — Task Breakdown

Phases must be completed in order. Each is a prerequisite for the next.

| File | Phase | Status |
|------|-------|--------|
| [phase-1-foundation.md](phase-1-foundation.md) | Persistence, debug cleanup, end screen | ✅ Done |
| [phase-2-retention.md](phase-2-retention.md) | Streaks, stats, shareable result card | ✅ Done |
| [phase-3-onboarding.md](phase-3-onboarding.md) | Interactive tutorial + mode provider architecture | 🟡 In progress (content iteration) |
| [phase-4-new-modes.md](phase-4-new-modes.md) | Main menu, Arcade mode, Library mode | Not started |
| [phase-5-monetization.md](phase-5-monetization.md) | Unlock state, depth gates, payment | Not started |
| [phase-6-leaderboard.md](phase-6-leaderboard.md) | Backend, auth, global leaderboards | Not started |
| [phase-sound.md](phase-sound.md) | Game feel audio (tactile SFX) | Waiting on assets — can implement any time |

See [PRODUCT_DIRECTION.md](../PRODUCT_DIRECTION.md) for the full strategic context behind these phases.
