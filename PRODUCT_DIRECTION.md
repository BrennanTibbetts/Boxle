# Boxle — Product Direction

> **For AI assistants:** Read this file first. It describes what Boxle is today, where it is going, and what to build next. It is the authoritative source for product decisions.

---

## What Boxle Is

Boxle is a **daily Star Battle logic puzzle game** with a 3D presentation. Star Battle (also called "Two Not Touch") is a constraint-satisfaction puzzle: place exactly N stars on a grid such that each row, column, and colored region contains exactly N stars, and no two stars are adjacent (including diagonally).

Each day, all players get the same sequence of 8 puzzles, scaling from 4×4 up to 11×11. The date-based seed ensures the experience is shared and therefore social.

**Core loop:** Place stars → wrong placement costs a life (3 lives total) → complete the grid to advance → finish all 8 to end the session.

---

## Current Technical State

**Stack:** React 18 + TypeScript, Three.js via React Three Fiber, GSAP animations, Zustand state management, Vite build.

**What works and is production-quality:**
- Star Battle puzzle engine: placement validation, win detection, cascade lock animations
- 13-rule hint system with visual cell highlighting (rule-based deduction, not brute force)
- 3D grid rendering with animated stars, glowing locked cells, and smooth camera pans
- Daily seed system: 680 pre-generated puzzles across 8 grid sizes, deterministically selected by date
- 3-lives system with animated feedback

**What is missing or prototype-only:**
- No persistence — all progress is lost on page refresh
- No onboarding — tutorial button stub exists but has no content
- No scoring, stats, streaks, or sharing
- No game modes beyond the single daily sequence
- No monetization infrastructure
- No main menu, results screen, or pause UI
- Leva debug panel is exposed to end users (must be removed for production)
- `version: 0.0.0` in package.json — pre-release

**Key files to know:**
- [src/stores/useGame.ts](src/stores/useGame.ts) — core state machine (phases, lives, progression, validation)
- [src/LevelManager.tsx](src/LevelManager.tsx) — renders and transitions between levels
- [src/components/Box.tsx](src/components/Box.tsx) — cell interaction, all input handling, animations
- [src/utils/hintRules.ts](src/utils/hintRules.ts) — all 13 hint deduction rules
- [src/hooks/useDailyPuzzles.ts](src/hooks/useDailyPuzzles.ts) — date-seeded puzzle selection and decoding
- [src/utils/puzzle.ts](src/utils/puzzle.ts) — seed math and board decode logic
- [src/interface/HUD.tsx](src/interface/HUD.tsx) — 2D overlay (level counter, lives, hint button)
- [data/puzzles.js](data/puzzles.js) — aggregates all 680 puzzles from 8 JSON files
- [src/components/TutorialButton.tsx](src/components/TutorialButton.tsx) — exists but renders nothing; stub for onboarding

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
- 8 puzzles per day, 4×4 → 11×11, date-seeded, same for all players worldwide
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

**Premium status is never stored in localStorage.** It is a backend/auth concern — derived from a JWT claim or API response after a verified purchase. A client-writable flag in localStorage is a security hole anyone can flip in DevTools. When Phase 5 arrives, premium state comes from the auth layer, not the persistence layer.

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

Build an **interactive tutorial level** — a guided 4×4 puzzle where the game walks new players through:
1. What regions are (color-coded areas)
2. The star constraint (exactly 1 star per row, column, and region)
3. The adjacency rule (no two stars can touch, even diagonally)
4. How marks work (eliminate candidate cells)
5. How the hint button works

Show automatically on first visit (localStorage flag). Always accessible via the tutorial button stub ([src/components/TutorialButton.tsx](src/components/TutorialButton.tsx)).

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

### Phase 3 — Onboarding
- [ ] Interactive tutorial level (guided 4×4 walkthrough)
- [ ] First-visit detection + auto-show

### Phase 4 — New Modes
- [ ] Arcade mode (auto-scaling survival, depth/score tracking)
- [ ] Library mode (batch progression through size tiers)
- [ ] Mode selection UI (home/main menu screen)

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
- **Click-and-hold star placement** — instead of an instant tap, holding a cell begins a slow fill/charge animation on that cell indicating a star is about to be placed. Releasing after the animation completes confirms the star; releasing early cancels. Adds tactile intention to placement and reduces accidental misclicks.

---

## What Not To Build (Yet)

- Energy/timer-based rate limiting — depth thresholds are the chosen model
- Cosmetics/themes — secondary; don't block on them
- Mobile app — web first, validate first
- Subscription model — one-time purchase is the chosen model
- Multiple puzzle types beyond Star Battle — stay focused

---

## Puzzle Content Notes

- 680 puzzles total across 8 grid sizes (4×4 through 11×11)
- Generator lives in [puzzle-generator/generate.js](puzzle-generator/generate.js) — offline tool, not integrated into the game
- At 8 puzzles/day, the current pool gives ~85 unique daily sessions before repetition
- Expanding the pool (especially 10×10 and 11×11, currently 50 and 30 puzzles) should happen before shipping Arcade and Library modes
- 1-star constraint for sizes 4–9; 2-star constraint for 10–11
