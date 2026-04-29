# Boxle — Product Direction

> **For AI assistants:** Read this file first. It describes what Boxle is today, where it is going, and what to build next. It is the authoritative source for product decisions.

---

## What Boxle Is

Boxle is a **daily logic puzzle game** with a 3D presentation, with two endless companion modes (Arcade and Library) that share the same engine. Each puzzle is a grid of boxes divided into colored regions; the goal is to place exactly one boxle in every row, column, and region, with no two boxles touching (not even diagonally).

Each day, all players get the same sequence of 5 puzzles, scaling from 4×4 up to 8×8. The date-based seed ensures the experience is shared and therefore social.

**Core loop:** Place boxles → wrong placement costs a life (3 lives) → complete the grid to advance → finish all 5 to end the daily session.

---

## Current Technical State

**Stack:** React 18 + TypeScript, Three.js via React Three Fiber, GSAP animations, Zustand state management, Vite build.

**What works and is production-quality:**
- Puzzle engine: placement validation, win detection, cascade lock animations
- 13-rule hint system with visual box highlighting (rule-based deduction, not brute force)
- 3D grid rendering with animated boxles, glowing locked boxes, and smooth camera pans between stacked levels
- Daily seed system: pre-generated puzzles for sizes 4×4–8×8, deterministically selected by date
- Runtime puzzle generator (S=1 only — see "current limitations") with single-slot prefetch cache to mask generation latency
- 3-lives system with animated feedback
- **All three modes live:** Daily, Arcade (infinite, sizes 4×4 → 18×18 cap), Library (10-puzzle batches per size, 4×4 → 18×18)
- Mode-aware boot routing via `lastActiveMode`: refresh mid-Arcade lands you back in the run; refresh mid-Daily resumes; otherwise menu (when daily is done) or daily (fresh day)
- Main menu (2D overlay): tile per mode + How to Play + Stats; daily-completed tile opens a performance modal instead of re-entering the game; arcade tile shows resume/new-run when a save exists
- Persistence (localStorage): daily progress, arcade run state, per-mode stats, library tier unlocks, last-completed daily snapshot, last-active mode
- Streak tracking: current and longest, daily-only by design, expiry checked on load
- Mode-aware end screens (Daily vs Arcade variants) and Library has its own batch-complete + game-over overlays
- Shareable result card: clipboard-only for now (mobile native share deferred)
- Stats modal with mode tabs (Daily / Arcade / Library), each tab showing mode-appropriate fields
- Phase 6 gate hook stubbed (`canPlayAt`) and wired at Arcade next-size and Library tier-entry call sites
- Mobile responsive: rules opens as a centered modal on small viewports (no board slide), menu tiles stack, library tier grid reflows

**Current limitations:**
- Runtime generator only handles S=1 — `defaultBoxlesPerRegion` is hardcoded to return 1; the S>1 codepath crashes (see [tasks/phase-4-new-modes.md](tasks/phase-4-new-modes.md) "Known generator limitation"). Practical effect: every Arcade and Library puzzle is single-boxle-per-region regardless of grid size.
- Generator time variance is high at sizes 15+ — typical case is fast, but rare seeds can take many seconds. Prefetch hides the common case; pathological cases would benefit from a Web Worker.
- Site is not yet mobile-playable (Phase 5)
- No monetization infrastructure yet (Phase 6)
- No leaderboards (Phase 7)
- Onboarding is a single static rules slide; interactive tutorial was removed on 2026-04-23 and reintroduction is pinned on real playtester feedback
- Library batches don't persist across reload yet (only Arcade does)
- `version: 0.0.0` in package.json — pre-release

**Key files to know:**

State stores:
- [src/stores/useGame.ts](src/stores/useGame.ts) — core state machine (phase, lives, progression, validation, levelConfigs/levels arrays, `activeMode`)
- [src/stores/usePersistence.ts](src/stores/usePersistence.ts) — localStorage schema (per-mode stats, dailySave, arcadeSave, lastActiveMode, libraryProgress, isPremium)
- [src/stores/useArcadeRun.ts](src/stores/useArcadeRun.ts) — Arcade run state (currentSize, puzzlesCompleted, run-total hints/lives)
- [src/stores/useLibraryRun.ts](src/stores/useLibraryRun.ts) — Library batch state (activeTierSize, puzzlesCompletedInTier, batch totals, batch-complete / game-over flags)
- [src/stores/useHint.ts](src/stores/useHint.ts) — active hint + `HintBoxRole` resolution; auto-clears on boxle placement
- [src/stores/useUI.ts](src/stores/useUI.ts) — `rulesOpen` flag

Mode providers (mounted by `Interface.tsx` based on `activeMode`):
- [src/modes/DailyModeProvider.tsx](src/modes/DailyModeProvider.tsx) — loads the daily sequence + runs persistence sync
- [src/modes/ArcadeModeProvider.tsx](src/modes/ArcadeModeProvider.tsx) — fresh-init or resume-from-save; subscribes to phase-ENDED for advance/end logic; debounced auto-save
- [src/modes/LibraryModeProvider.tsx](src/modes/LibraryModeProvider.tsx) — tier picker / in-batch / batch-complete / game-over routing

Generator:
- [src/generator/generate.ts](src/generator/generate.ts) — runtime puzzle generator (S=1 only); `defaultBoxlesPerRegion(N)` is hardcoded to 1
- [src/generator/prefetch.ts](src/generator/prefetch.ts) — single-slot background cache (`arcade` and `library` namespaces)
- [src/generator/PuzzleBuffer.ts](src/generator/PuzzleBuffer.ts) — multi-slot buffer utility (built but not currently wired; the simpler single-slot prefetch is in use)

Game / rendering:
- [src/LevelManager.tsx](src/LevelManager.tsx) — pure renderer; reads `levelConfigs` from store
- [src/components/Box.tsx](src/components/Box.tsx) — box interaction, all input handling, animations
- [src/utils/hintRules.ts](src/utils/hintRules.ts) — all 13 hint deduction rules
- [src/hooks/useDailyPuzzles.ts](src/hooks/useDailyPuzzles.ts) — date-seeded puzzle selection
- [src/hooks/usePersistenceSync.ts](src/hooks/usePersistenceSync.ts) — wires daily game state to persistence; restore-then-subscribe ordering is intentional
- [src/hooks/useIsMobile.ts](src/hooks/useIsMobile.ts) — `(max-width: 768px)` matchMedia hook
- [src/utils/puzzle.ts](src/utils/puzzle.ts) — seed math and board decode logic
- [src/utils/gates.ts](src/utils/gates.ts) — `canPlayAt(size, mode)` gate stub for Phase 6

UI:
- [src/interface/Interface.tsx](src/interface/Interface.tsx) — mode-routed shell; `useBootMode` (lastActiveMode-based routing) + `useTrackActiveMode`
- [src/interface/HUD.tsx](src/interface/HUD.tsx) — bottom bar (level, lives, clear marks, hint, `?`); defines `COLOR_LABELS`. The `☰ Menu` button lives separately at top-left in `.hud-corner`
- [src/interface/MainMenu.tsx](src/interface/MainMenu.tsx) — Daily / Arcade / Library tiles + How to Play + Stats
- [src/interface/EndScreen.tsx](src/interface/EndScreen.tsx) — mode-aware end screen (DailyEndContent + ArcadeEndContent)
- [src/interface/DailyPerformanceModal.tsx](src/interface/DailyPerformanceModal.tsx) — opens from menu when daily is complete; shows the day's result without re-entering the game
- [src/interface/LibraryTierPicker.tsx](src/interface/LibraryTierPicker.tsx) — tier grid, locked beyond `unlockedMaxSize`
- [src/interface/LibraryBatchComplete.tsx](src/interface/LibraryBatchComplete.tsx) — overlay shown after the 10th puzzle
- [src/interface/LibraryGameOver.tsx](src/interface/LibraryGameOver.tsx) — overlay shown when lives=0 mid-batch
- [src/interface/StatsModal.tsx](src/interface/StatsModal.tsx) — Daily / Arcade / Library tabs
- [src/interface/RulesModal.tsx](src/interface/RulesModal.tsx) — side-panel in-game-on-desktop, centered modal on menu or mobile

Data:
- [data/puzzles.js](data/puzzles.js) — aggregates the daily pool (sizes 4–8 imported; 9/10/11 JSON files exist but are no longer imported)

---

## Target Audience

**Both casual and enthusiast players, with a casual entry point.** The design goal is a 5-minute daily experience that hooks casual players (Wordle crowd) while offering enough depth to retain puzzle enthusiasts. The onboarding must be frictionless; the depth must be real.

---

## Platform Strategy

**Web-first.** Ship, validate product-market fit, then port to mobile. Do not let mobile architecture decisions block shipping the web version.

**iOS will be a native Swift rewrite**, not a React Native or Expo port. The web codebase is web-only scaffolding. The important shared artifact is the **data schema** — design localStorage keys and stat shapes as if they will eventually map 1:1 to a backend API, because they will.

---

## The Three Game Modes

### 1. Daily Puzzle — Free, Always
- 5 puzzles per day, 4×4 → 8×8, date-seeded, same for all players worldwide
- Capped: completing the sequence is the natural endpoint each day
- This is the daily ritual, the primary acquisition hook, and the sharing surface
- Never paywalled

### 2. Arcade Mode — Survival Run (Free up to a depth threshold)
- Auto-scaling: start at 4×4, succeed to advance to the next grid size
- Lives persist across puzzles in a run; exhaust lives and the run ends
- "How deep can you go?" is the core tension — depth/score drives competition
- **Free:** up to 8×8. **Paid:** 9×9 through 11×11
- Depth score feeds into the leaderboard

### 3. Library Mode — Progression Ladder (Free up to a depth threshold)
- Play batches of same-size puzzles; complete a batch to unlock the next tier
- Players climb the difficulty ladder at their own pace
- More "puzzle app" feel — mastery over competition
- **Free:** up to 6×6 or 7×7. **Paid:** higher sizes
- Exact thresholds TBD based on playtesting

**Rate-limiting philosophy:** Depth threshold only — not play counts, not energy timers. Give players enough free content to get genuinely hooked before hitting a wall. The free tier must feel generous.

---

## Accounts & Persistence

**Accounts are a future feature, not a Phase 2 concern.** Casual players must be able to play with zero friction — no sign-up required. localStorage is the correct persistence mechanism for the web version.

**With an account:** stats, streaks, and progress sync to the backend and survive across devices and platforms.

**Without an account:** all data is localStorage-bound. If a user clears their browser or switches devices, their streak resets. This is expected and honest behavior — not a bug.

**Schema discipline:** design localStorage keys and stat shapes as if they will be sent to a REST API. When accounts arrive, the sync layer becomes push-on-login / pull-on-new-device. A clean schema now makes that migration trivial.

**Premium status is never *authoritative* from localStorage.** The persistence schema includes `isPremium: boolean` for 1:1 parity with the future backend payload, but in the no-account web path it is always `false` — a passive mirror, never a source of truth. Unlock decisions must come from the auth layer (JWT claim / API response after a verified purchase) when an account is linked. A locally flipped flag must never unlock content; assume DevTools exists.

---

## Monetization

**Model:** Single one-time purchase unlocks everything.

**Price:** $2.99 — impulse-buy tier, maximize conversion, build player base first.

**Free tier includes permanently:**
- Daily puzzle (always free, forever — this is non-negotiable)
- Arcade mode up to depth threshold
- Library mode up to depth threshold
- All retention features: streaks, stats, sharing

**Paid unlock includes:**
- Full Arcade mode (all grid sizes)
- Full Library mode (all 8 size tiers)
- Future content when added

**Cosmetics:** Intentionally deprioritized. The architecture should not make themes/skins hard to add later, but do not build them now. Modes and monetization come first.

---

## Retention & Engagement

All four of these must be built. Persistence (localStorage) is the prerequisite.

1. **Streak tracking** — consecutive days with a completed daily puzzle; misses reset it
2. **Personal stats** — per-session and all-time: solve time, lives used, hints taken
3. **Shareable result card** — spoiler-free daily result (emoji/symbol grid) for social posting; this is free viral distribution
4. **Leaderboard** — fastest daily solve time globally (and eventually friends); requires backend/auth

---

## Onboarding

**Current state (as of 2026-04-23):** a single static **rules slide**, no guided walkthrough.

The interactive tutorial (three-level walkthrough, bot-driven demos, in-scene hand cursor, step-scripted controller) was built and then removed — it had become too complex for the value it delivered. The rules slide ([src/interface/RulesModal.tsx](src/interface/RulesModal.tsx)) explains regions, rows/columns, adjacency, and mark/boxle interaction; it auto-opens on first visit (via `boxle-rules-seen` in localStorage) and is reachable any time from the `?` button in the HUD.

Whether a richer onboarding is needed is an **open question pinned on real playtester observation**. Don't rebuild the guided tutorial speculatively — watch first-time players with the rules slide first.

**Design conventions** (apply to rules copy, hint text, and any future user-facing explanation of regions/rows/cols):
- Reference regions by color, not index — use the `COLOR_LABELS` from [src/interface/HUD.tsx](src/interface/HUD.tsx) exactly (`Yellow`, `Purple`, `Aqua`, `Red`, `White`, `Green`, ...). The hint-description renderer styles each occurrence in the region's color.
- Describe rows/columns spatially ("leftmost column", "bottom row", "fourth column from the left") — never use 0-indexed coordinates in user-facing text.
- Styling matches the in-game HUD — Bebas Neue with the translucent-glass bubble (`backdrop-filter: blur(6px)`), not a dark modal card.

---

## Build Priority Order

Phases ship in order; each is a prerequisite for the next.

| Phase | Status |
|-------|--------|
| **1 — Foundation** (persistence, end screen, Leva-in-prod fix) | ✅ Shipped |
| **2 — Retention** (streaks, per-mode stats, share card) | ✅ Shipped |
| **3 — Onboarding** (static `RulesModal`; tutorial gutted) | ✅ Closed; pinned on playtester feedback |
| **4 — New Modes** (Daily / Arcade / Library, runtime generator, mode-aware stats) | ✅ Functionally done; generator S>1 fix queued |
| **5 — Mobile-friendly web** (touch gestures, portrait camera, responsive HUD, low-end perf validation) | 🔲 **Next up** — site is currently mobile-unplayable; share card lands on broken phones |
| **6 — Monetization** (`$2.99` one-time unlock; depth gates) | 🔲 Blocked on Phase 5 — gate hook stubbed at Arcade next-size and Library tier-entry call sites |
| **7 — Leaderboard** (backend, auth, global leaderboards) | 🔲 Blocked on Phase 6 |

Side tracks (independent of the main phase order):
- **Sound** ([tasks/phase-sound.md](tasks/phase-sound.md)) — game-feel audio; waiting on assets
- **Perf** ([tasks/phase-perf.md](tasks/phase-perf.md)) — Tier 1 shipped; Tier 2/3 gated on low-end-device measurement

**Note on Phase 4 infrastructure:** The mode-provider pattern (`src/modes/*`) is the integration point. Each mode mounts its own provider in `Interface.tsx` and owns its own puzzle-loading + persistence strategy. Do not re-architect — follow the existing pattern.

**Note on Phase 5 reordering (2026-04-28):** Mobile-friendly web was promoted ahead of monetization. Reasoning: shared daily-result cards are the viral acquisition loop, shared links are tapped from phones, and today the placement gesture (`onDoubleClick` + shift-modifier) has no touch equivalent — so paid acquisition before mobile-fix would funnel users into a broken site. Web-first still implies *playable* on mobile web even though iOS will eventually get a native Swift rewrite.

---

## Future Ideas (Unscheduled)

Design and polish ideas to revisit after the phase roadmap is further along. Not prioritized, not blocked on.

- **Level preview camera animation** — on level start, begin with the camera tilted/angled toward the far end of the grid, then animate it down to the normal play position. Gives the player a brief aerial overview of the full puzzle before settling into the default view.
- **Click-and-hold boxle placement** — instead of an instant tap, holding a box begins a slow fill/charge animation on that box indicating a boxle is about to be placed. Releasing after the animation completes confirms the boxle; releasing early cancels. Adds tactile intention to placement and reduces accidental misclicks.
- **Real share surface** — current share button is clipboard-only. When virality is a priority and mobile is in scope, add `navigator.share()`, OG preview images, and platform-specific link previews (Twitter/Bluesky/iMessage).
- **Bake-off the two puzzle generators** — my generator vs. a friend's alternate algorithm. Both are more than sufficient today; worth comparing output distribution, speed, and uniqueness before committing to one for on-demand (Arcade) or infinite generation.
- **Infinity mode** — both generators are fast enough to produce puzzles on-demand at runtime. A fourth mode that generates forever is feasible; park it until Arcade/Library prove the appetite for endless play.

---

## What Not To Build (Yet)

- Energy/timer-based rate limiting — depth thresholds are the chosen model
- Cosmetics/themes — secondary; don't block on them
- Mobile app — web first, validate first
- Subscription model — one-time purchase is the chosen model
- Multiple puzzle types beyond the core placement logic — stay focused

---

## Puzzle Content Notes

- Daily uses the pre-generated pool for sizes 4×4 through 8×8 (recoverable from git history if we ever want to scale daily back up to larger pools — the 9/10/11 JSONs were removed in the 2026-04-28 cleanup)
- Arcade and Library generate on-demand via the runtime generator in [src/generator/generate.ts](src/generator/generate.ts), ported from [puzzle-generator/generate.js](puzzle-generator/generate.js)
- At 5 puzzles/day, the 4–8 pool size gives plenty of unique daily sessions before any repetition
- 1-boxle constraint for sizes 4–9; 2-boxle constraint for 10+ (Arcade territory)
