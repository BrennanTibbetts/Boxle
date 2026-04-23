# Phase 4 — New Modes

Requires Phase 1 (persistence) for progress tracking. Requires Phase 5 (monetization) to gate access beyond free thresholds, but modes can be built and tested without gates first.

---

## 4.1 Main Menu / Mode Selection Screen

The entry point players land on — replaces the current behavior of launching directly into the daily puzzle.

- [ ] Design layout: Daily Puzzle, Arcade, Library as three cards/tiles; tutorial accessible from here too
- [ ] Show streak and today's daily completion status on the Daily Puzzle card
- [ ] Build `src/interface/MainMenu.tsx`
- [ ] Update app entry point to show menu first (not the game immediately)
- [ ] Transition from menu → mode should feel smooth (camera push or fade)

## 4.2 Arcade Mode

Survival run — how deep can you go?

- [ ] Define run state: current grid size, lives remaining, depth score, puzzles completed this run
- [ ] Puzzle selection: pull a random (seeded, not daily) puzzle at each size from the existing pool
- [ ] Auto-advance to next grid size on completion; same life pool carried over
- [ ] Run ends when lives reach 0; show depth score on end screen
- [ ] Free threshold: up to 8×8. Gate 9×9–11×11 behind paid unlock (Phase 5 wires this)
- [ ] Track personal best depth score in persistence

## 4.3 Library Mode

Progression ladder — master each size before unlocking the next.

- [ ] Define tier state: which tiers are unlocked, how many puzzles completed per tier
- [ ] Each tier is a batch of N puzzles at the same grid size (decide batch size — e.g. 5 or 10)
- [ ] Completing a batch unlocks the next tier
- [ ] Allow replaying completed tiers freely
- [ ] Free threshold: up to 6×6 or 7×7 (TBD after playtesting). Gate higher tiers behind paid unlock (Phase 5)
- [ ] Track per-tier completion stats in persistence
- [ ] Puzzle selection: cycle through available puzzles for that size, avoid repeats until pool exhausted
