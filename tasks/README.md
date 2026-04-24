> ## ⚠ READ FIRST — Execution Status (as of 2026-04-23)
>
> **Current position: Phases 1–3 closed out. Ready to start Phase 4.**
>
> | Phase | Status | Notes |
> |-------|--------|-------|
> | Phase 1 — Foundation | ✅ **Complete** | All persistence / end-screen / prod-build work done. |
> | Phase 2 — Retention | ✅ **Complete** | Streaks, per-session + all-time stats, clipboard-based share card all shipped. Real social/share-link work deferred (see follow-up in phase-2 file). |
> | Phase 3 — Onboarding | ✅ **Closed for now** | Interactive tutorial was **gutted** on 2026-04-23 — replaced with a static `RulesModal` (first-visit + `?` HUD button). Pinned: find real playtesters to decide whether a richer tutorial is needed. **Not a blocker for Phase 4.** |
> | Phase 4 — New Modes | 🔲 **Next up** | Mode-provider scaffolding exists (`src/modes/DailyModeProvider.tsx`, `GameMode` enum with `DAILY`/`ARCADE`/`LIBRARY`). Build Arcade + Library providers and a main-menu entry point. |
> | Phase 5 — Monetization | 🔲 Not started | Blocked until Phase 4. |
> | Phase 6 — Leaderboard | 🔲 Not started | Blocked until Phase 5. |
>
> **Design conventions still in force** (apply to hint text, rules copy, and any future user-facing explanation):
> - Regions referenced by color, using exact `COLOR_LABELS` values from `src/interface/HUD.tsx`
> - Rows/columns described spatially ("leftmost column", "bottom row") — never 0-indexed
> - Styling matches in-game HUD (Bebas Neue, translucent-glass bubble) — not dark modal cards

# Boxle — Task Breakdown

Phases must be completed in order. Each is a prerequisite for the next.

| File | Phase | Status |
|------|-------|--------|
| [phase-1-foundation.md](phase-1-foundation.md) | Persistence, debug cleanup, end screen | ✅ Done |
| [phase-2-retention.md](phase-2-retention.md) | Streaks, stats, shareable result card | ✅ Done |
| [phase-3-onboarding.md](phase-3-onboarding.md) | Rules modal (tutorial gutted) | ✅ Closed for now; pinned on real playtester feedback |
| [phase-4-new-modes.md](phase-4-new-modes.md) | Main menu, Arcade mode, Library mode | Not started |
| [phase-5-monetization.md](phase-5-monetization.md) | Unlock state, depth gates, payment | Not started |
| [phase-6-leaderboard.md](phase-6-leaderboard.md) | Backend, auth, global leaderboards | Not started |
| [phase-sound.md](phase-sound.md) | Game feel audio (tactile SFX) | Waiting on assets — can implement any time |
| [phase-perf.md](phase-perf.md) | Draw-call reduction (fold overlays, InstancedMesh) | Tier 1 done; Tier 2/3 queued, not urgent |

See [PRODUCT_DIRECTION.md](../PRODUCT_DIRECTION.md) for the full strategic context behind these phases.
