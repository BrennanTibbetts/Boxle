# Boxle — Product Direction

> **For AI assistants:** Read this file first. It describes what Boxle is today, where it is going, and what to build next. It is the authoritative source for product decisions.

---

## What Boxle Is

Boxle is a **daily logic puzzle game** with a 3D presentation. Each puzzle is a grid of boxes divided into colored regions; the goal is to place exactly N boxles such that each row, column, and region contains exactly N, and no two boxles are adjacent (including diagonally).

Each day, all players get the same sequence of 5 puzzles, scaling from 4×4 up to 8×8. The date-based seed ensures the experience is shared and therefore social.

**Core loop:** Place boxles → wrong placement costs a life (3 lives total) → complete the grid to advance → finish all 8 to end the session.

---

## Current Technical State

**Stack:** React 18 + TypeScript, Three.js via React Three Fiber, GSAP animations, Zustand state management, Vite build.

**What works and is production-quality:**
- Puzzle engine: placement validation, win detection, cascade lock animations
- 13-rule hint system with visual box highlighting (rule-based deduction, not brute force)
- 3D grid rendering with animated boxles, glowing locked boxes, and smooth camera pans
- Daily seed system: 680 pre-generated puzzles across 8 grid sizes, deterministically selected by date
- 3-lives system with animated feedback
- Persistence layer (localStorage): daily progress survives page refresh, session stats accumulate all-time
- Streak tracking: current and longest streak, expiry checked on load
- Session end screen: levels, time, hints, mistakes, streak display
- Shareable result card: emoji grid + streak line, `navigator.share()` on mobile / clipboard fallback on desktop
- Stats modal: win rate, best time, all-time hints and mistakes

**What is missing or prototype-only:**
- Onboarding is a single static rules slide (`RulesModal`). The interactive tutorial system was removed on 2026-04-23; whether we need more than a rules slide is pinned on real playtester feedback
- Only one game mode exists (Daily); mode-provider scaffolding is in place for Arcade/Library but those providers aren't built
- No monetization infrastructure
- No main menu or pause UI — the app launches straight into the daily
- `version: 0.0.0` in package.json — pre-release

**Key files to know:**
- [src/stores/useGame.ts](src/stores/useGame.ts) — core state machine (phases, lives, progression, validation); also holds `activeMode` for mode routing
- [src/stores/usePersistence.ts](src/stores/usePersistence.ts) — localStorage persistence (stats, streaks, daily save)
- [src/hooks/usePersistenceSync.ts](src/hooks/usePersistenceSync.ts) — wires game state to persistence; restore-then-subscribe ordering is intentional
- [src/LevelManager.tsx](src/LevelManager.tsx) — pure renderer; reads `levelConfigs` from store, no longer loads puzzles itself
- [src/components/Box.tsx](src/components/Box.tsx) — box interaction, all input handling, animations
- [src/utils/hintRules.ts](src/utils/hintRules.ts) — all 13 hint deduction rules
- [src/stores/useHint.ts](src/stores/useHint.ts) — active hint + `HintBoxRole` resolution; auto-clears on boxle placement
- [src/hooks/useDailyPuzzles.ts](src/hooks/useDailyPuzzles.ts) — date-seeded puzzle selection and decoding
- [src/utils/puzzle.ts](src/utils/puzzle.ts) — seed math and board decode logic
- [src/interface/HUD.tsx](src/interface/HUD.tsx) — 2D overlay (level counter, lives, hint button, `?` rules button); defines `COLOR_LABELS` used across UI
- [src/interface/Interface.tsx](src/interface/Interface.tsx) — mode-routed UI shell; mounts mode providers + conditional overlays
- [src/interface/EndScreen.tsx](src/interface/EndScreen.tsx) — session complete / game over overlay with share and stats
- [src/interface/StatsModal.tsx](src/interface/StatsModal.tsx) — all-time stats overlay
- [src/interface/RulesModal.tsx](src/interface/RulesModal.tsx) — static rules slide; first-visit auto-open via `boxle-rules-seen` flag, also openable from HUD `?` button
- [data/puzzles.js](data/puzzles.js) — aggregates all 680 puzzles from 8 JSON files
- [src/modes/DailyModeProvider.tsx](src/modes/DailyModeProvider.tsx) — loads the daily sequence + runs persistence sync

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

Work through these phases in order. Each phase is a prerequisite for the next.

### Phase 1 — Foundation ✅ Complete
- [x] Persistence layer (localStorage: progress, stats, streaks, unlock state)
- [x] Remove Leva debug panel from production builds
- [x] Game over / session complete screen (ENDED phase currently has no UI)

### Phase 2 — Retention Hooks ✅ Complete
- [x] Streak tracking
- [x] Personal stats (per-session + all-time)
- [x] Shareable daily result card

### Phase 3 — Onboarding ✅ Closed for now (tutorial gutted; pinned on playtester feedback)
- [x] Mode-provider scaffolding (`GameMode` enum, `DailyModeProvider`); still the foundation for Phase 4
- [x] Static `RulesModal` with first-visit auto-open (`boxle-rules-seen`) and HUD `?` button
- [ ] **Pinned:** observe real first-time players with the rules slide before deciding whether to reintroduce any guided tutorial pieces

### Phase 4 — New Modes
- [ ] Runtime puzzle generator + pre-generation buffer (Arcade/Library generate on-demand; Daily keeps the curated pool)
- [ ] Stats schema migration to per-mode nested shape; streak stays daily-only
- [ ] Main Menu (2D overlay, tiles for Daily / Arcade / Library + How to Play + Stats)
- [ ] Boot-state routing: resume-first when daily in-flight, menu when daily complete, daily-first on a new day
- [ ] Arcade mode provider (3 lives per run, random survival, 4×4 → 15×15 cap, no score display yet)
- [ ] Library mode provider (batches of 10, completing a batch unlocks size+1, replays free)
- [ ] Phase 5 gate hooks stubbed (always-allow body) at the Arcade next-size and Library tier-unlock call sites

**Note on Phase 4 infrastructure:** The mode-provider pattern (`src/modes/*`) is the integration point. Each mode mounts its own provider in `Interface.tsx` and owns its own puzzle-loading + persistence strategy. Do not re-architect — follow the existing pattern.

### Phase 5 — Monetization
- [ ] Unlock state in persistence layer (free vs. paid per mode)
- [ ] Depth gates in Arcade and Library
- [ ] Payment integration ($2.99 one-time)

### Phase 6 — Leaderboard
- [ ] Backend + auth infrastructure
- [ ] Global fastest daily solve leaderboard
- [ ] Arcade high-score leaderboard

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

- Daily uses the pre-generated pool for sizes 4×4 through 8×8 (the 9/10/11 JSON files still exist in `data/` but are no longer imported — kept as reference, can be re-enabled if we scale the daily back up)
- Arcade and Library generate on-demand via the runtime generator in [src/generator/generate.ts](src/generator/generate.ts), ported from [puzzle-generator/generate.js](puzzle-generator/generate.js)
- At 5 puzzles/day, the 4–8 pool size gives plenty of unique daily sessions before any repetition
- 1-boxle constraint for sizes 4–9; 2-boxle constraint for 10+ (Arcade territory)
