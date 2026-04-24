# Phase 4 — New Modes

Requires Phase 1 (persistence) for progress tracking. Monetization gates are **not** wired in this phase — they come in Phase 5. Phase 4 builds the modes, menu, and stats schema to completion on a fully-unlocked assumption.

Locked-in design decisions from the Phase 4 Socratic (Round 1 + Round 2):

- **Landing behavior:** resume-first when daily is in-flight; menu when daily is complete for today; daily-first on a fresh day.
- **Puzzle source:** daily keeps the curated 680-puzzle pool. Arcade + Library generate on-demand via a runtime-integrated generator with a small pre-generation buffer.
- **Arcade:** 3 lives for the whole run, random survival, auto-scales 4×4 upward, caps at 15×15. No score display yet — track depth internally; leaderboards are Phase 6.
- **Library:** batches of 10 puzzles per size. Completing a batch unlocks size N+1. Completed tiers replay freely.
- **Stats:** nested per-mode with mode-appropriate shapes. Streak is daily-only.
- **Menu:** 2D overlay on top of the live game canvas, canvas blurred behind.
- **How to play:** dedicated menu tile + keep the existing HUD `?` button for in-game re-reference.
- **Free tier placeholders:** Arcade free up to 10×10, Library free through tier 7. **Phase 4 does not enforce these** — the gate-check function always returns "allowed"; Phase 5 swaps in real logic.

---

## 4.0 Foundations

Scaffolding required before any user-visible mode work.

### 4.0.1 Runtime puzzle generator

- [ ] Port [puzzle-generator/generate.js](../puzzle-generator/generate.js) into `src/generator/` — pure TypeScript, no Node deps, tree-shakeable
- [ ] Expose `generatePuzzle(size: number, boxlesPerRegion: number): Board` matching the existing `Board` shape consumed by `decodeBoard` / `LevelManager`
- [ ] Decide boxle-per-region constraint for sizes 12–15 (generator-dependent — likely 2, possibly 3 for the largest). Document the decision in this file once made.

### 4.0.2 Pre-generation buffer

- [ ] Small async queue that generates N puzzles ahead of the player (N=2 to start, tune later). Runs during the current puzzle to keep mode transitions instant.
- [ ] Shared utility usable by both Arcade (next-size-up prefetch) and Library (batch prefetch at tier start).

### 4.0.3 Stats schema rewrite

The current flat `usePersistence` schema is daily-implicit. Rewrite to nested per-mode shape. **No migration needed** — pre-launch, no live users.

Target shape:

```
stats: {
  daily: {
    sessionsPlayed, sessionsCompleted,
    bestTimeMs,
    hintsUsed, livesLost,
    currentStreak, longestStreak,
    lastCompletedDate,
  },
  arcade: {
    runsPlayed, runsCompleted,           // "completed" = hit the 15×15 cap
    deepestSizeEver,
    hintsUsed, livesLost,
  },
  library: {
    tierCompletions: { 4: n, 5: n, ..., 11: n, ... },
    hintsUsed, livesLost,
  },
}
```

- [ ] Replace flat fields in `usePersistence` with the nested shape above
- [ ] Update `usePersistenceSync` and all call sites in `useGame`, `HUD`, `EndScreen`, `StatsModal` to read/write the new paths
- [ ] No version-gate / no migration code — clean rewrite

### 4.0.4 Routing in `Interface.tsx`

Boot-state decision tree based on persistence:
- Daily exists for today & incomplete → render Daily provider + session HUD
- Daily exists for today & complete → render Menu
- No daily for today (new day) → render Daily provider, auto-load today's puzzles

Mid-play menu access from a small HUD control that calls `setMode(GameMode.MENU)` or similar. Pick a name that reads naturally (`GameMode.MENU` is fine unless a better one surfaces during build).

- [ ] Add `MENU` to `GameMode` enum (now `DAILY | ARCADE | LIBRARY | MENU`)
- [ ] Move the boot-state logic out of the current "always Daily" assumption
- [ ] HUD gains a small menu-back affordance during mode play

---

## 4.1 Main Menu

2D overlay component. Canvas stays mounted behind it with a blur/dim treatment.

- [ ] `src/interface/MainMenu.tsx` — three primary tiles: **Daily**, **Arcade**, **Library**; plus secondary buttons for **How to Play** (opens `RulesModal`) and **Stats** (opens `StatsModal` with the mode selector)
- [ ] Daily tile shows: today's completion status, current streak
- [ ] Arcade tile shows: deepest size ever
- [ ] Library tile shows: highest unlocked tier + progress within it (e.g. "6/10 at 5×5")
- [ ] Tapping a tile calls `setMode(...)`; transition can be a fade for now — fancy camera pushes are polish, not shipping
- [ ] Menu respects the HUD visual language (Bebas Neue, translucent-glass, backdrop blur)

## 4.2 Arcade Mode

- [ ] `src/modes/ArcadeModeProvider.tsx` — loads the first puzzle (4×4), initializes run state, kicks off pre-gen for the next puzzle
- [ ] Run state (in persistence or in-memory — leaning in-memory for simplicity, flush-on-run-end to `stats.arcade`):
  - `currentSize`, `livesRemaining`, `puzzlesCompletedThisRun`
- [ ] Auto-advance on completion: if `currentSize < 15`, load next size; else show "Run Complete" end screen
- [ ] Run ends: 0 lives → game-over variant of `EndScreen`; hit 15×15 → "run complete" variant
- [ ] On run end, write to `stats.arcade`: increment `runsPlayed`, update `deepestSizeEver`, accumulate hints/lives
- [ ] Arcade doesn't use `persistence.daily` at all — it's ephemeral state

## 4.3 Library Mode

- [ ] `src/modes/LibraryModeProvider.tsx`
- [ ] Tier state lives in persistence:
  - `library.unlockedMaxSize` (starts at 4 — player has 4×4 unlocked)
  - `library.tierProgress: { [size]: { completed: n, completedBatches: n } }`
- [ ] Tier entry screen: shows current progress in that size (e.g. "3/10"); player taps Play to start next puzzle in the batch
- [ ] On puzzle completion: increment `completed`; when `completed === 10`, increment `completedBatches`, unlock size+1, reset `completed` to 0 for the next batch at this size
- [ ] Replays of completed tiers: a "Replay" button on any unlocked tier; runs a 10-puzzle batch that doesn't affect unlock state (completions still count toward `tierCompletions`)
- [ ] Puzzle selection: pre-gen buffer generates the current tier's batch; no repeats within a batch (buffer handles this)

## 4.4 StatsModal mode selector

- [ ] Add a mode selector to `StatsModal.tsx` — tabs or dropdown, Daily default
- [ ] Render only the stats relevant to the selected mode (see schema shapes in 4.0.3)
- [ ] All-time hints/lives shown as a cross-mode total at the bottom of the modal, optional

---

## Phase 5 hooks (stub only in Phase 4)

- [ ] `src/utils/gates.ts` with `canPlayAt(size: number, mode: GameMode): boolean` — body returns `true` for everything in Phase 4
- [ ] Call sites: Arcade's next-size-up transition, Library's tier-unlock check
- [ ] Phase 5 replaces the body; Phase 4 leaves the hook points ready
