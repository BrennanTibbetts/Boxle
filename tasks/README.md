# Boxle — Task Breakdown

> **Current position (2026-04-28):** Phases 1–4 shipped; codebase post-cleanup pass. Phase 5 (mobile-friendly web) is next — monetization moved to Phase 6 because the share card is the viral surface and shared links land on phones, where the site is currently unplayable.

| File | Phase | Status |
|------|-------|--------|
| [phase-3-onboarding.md](phase-3-onboarding.md) | Rules modal (tutorial gutted) | ✅ Closed for now; pinned on real playtester feedback |
| [phase-4-new-modes.md](phase-4-new-modes.md) | Main menu, Arcade mode, Library mode | ✅ Functionally done; design notes + generator S>1 fix queued |
| [phase-5-mobile.md](phase-5-mobile.md) | Touch gestures, portrait camera, HUD responsive pass, mobile perf | 🔲 **Next up** — site is currently mobile-unplayable |
| [phase-6-monetization.md](phase-6-monetization.md) | Unlock state, depth gates, payment | 🔲 Blocked on Phase 5 — gate hook stubbed |
| [phase-7-leaderboard.md](phase-7-leaderboard.md) | Backend, auth, global leaderboards | 🔲 Not started; blocked on Phase 6 |
| [phase-sound.md](phase-sound.md) | Game feel audio (tactile SFX) | 🔲 Waiting on assets — can implement any time |
| [phase-perf.md](phase-perf.md) | Draw-call reduction (fold overlays, InstancedMesh) | Tier 1 shipped; Tier 2/3 gated on Phase 5 mobile measurement |
| [bugs&ideas.md](bugs&ideas.md) | Misc | Notes |

Phases 1 (Foundation), 2 (Retention), and the post-Phase-4 cleanup audit completed; their docs were removed once shipped (history is in git).

**Design conventions still in force** (apply to hint text, rules copy, and any future user-facing explanation):
- Regions referenced by color, using exact `COLOR_LABELS` values from [src/interface/HUD.tsx](../src/interface/HUD.tsx)
- Rows/columns described spatially ("leftmost column", "bottom row") — never 0-indexed
- Styling matches in-game HUD (Bebas Neue, translucent-glass bubble) — not dark modal cards
- Mobile-friendly: rules opens as a centered modal (no board-slide) on `(max-width: 768px)` or on the main menu

**Known generator limitation:** the runtime generator ([src/generator/generate.ts](../src/generator/generate.ts)) crashes for S>1. `S` is hardcoded to `1`, so Arcade and Library both run their full 4×4–18×18 range at S=1. Fix is queued in [phase-4-new-modes.md](phase-4-new-modes.md) but not blocking.

See [PRODUCT_DIRECTION.md](../PRODUCT_DIRECTION.md) for the full strategic context behind these phases.
