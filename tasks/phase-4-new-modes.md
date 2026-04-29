# Phase 4 — New Modes

**Status: ✅ Functionally complete (as of 2026-04-26).** Daily, Arcade, and Library are all playable end-to-end. Phase 6 swaps in real monetization gates at the existing `canPlayAt` call sites; everything else here is reference for future-me.

---

## Locked-in design decisions

- **Landing behavior:** routes to *whichever mode you were last actually in* via `lastActiveMode` — Arcade resumes mid-run on refresh, Daily resumes mid-puzzle on refresh, otherwise menu (when daily is done) or daily (fresh day).
- **Puzzle source:** Daily uses the curated pre-generated pool (sizes 4–8 only). Arcade and Library generate on-demand via the runtime generator with a single-slot prefetch cache to mask generation latency.
- **Arcade:** **infinite** survival run. 3 lives for the whole run. Grid size grows 4×4 → 18×18, then *stays* at 18×18 forever — the cap is a grid-size ceiling, not a run terminator. Run only ends on lives=0. No score display yet (deepest size + puzzles cleared shown on end screen); leaderboards are Phase 7.
- **Library:** batches of 10 puzzles per size. Completing a batch unlocks size N+1. Replays of completed tiers don't re-unlock anything but accumulate `tierCompletions`. Lives=0 mid-batch is a real game over → restart batch from puzzle 1.
- **Stats:** nested per-mode shape (`stats.daily`, `stats.arcade`, `stats.library`), each with mode-appropriate fields. Streak is daily-only.
- **Menu:** 2D overlay on top of the live game canvas, blurred/dimmed backdrop. Arcade tile shows Resume + secondary New Run when there's a saved run.
- **HUD layout:** main bar (level, lives, clear marks, hint, ?) lives at the **bottom**. **☰ Menu** lives separately at top-left.
- **How to play:** dedicated menu button + the existing HUD `?` for in-game re-reference. Side-panel slide-in is desktop-only and in-game-only; on the menu (or on mobile) it's a centered modal with no board shift.
- **Generator constraint:** **S=1 forced** for all runtime generation. The S>1 codepath has indexing bugs — see "Known generator limitation" below.
- **Free tier placeholders:** Arcade free up to 10×10, Library free through tier 7. Phase 4 does not enforce these — `canPlayAt` returns `true` unconditionally; Phase 6 swaps in real logic.

---

## Known generator limitation (2026-04-26)

The runtime puzzle generator ([src/generator/generate.ts](../src/generator/generate.ts)) only correctly handles **S=1**. The S>1 codepath crashes in `findAlternativeSolution` due to an indexing assumption (region IDs sized by N rather than N×S). See the project memory `project_boxle_generator_s2_broken.md` for root-cause notes.

**Workaround in effect:** `S` is hardcoded to `1` at the top of `generate.ts`. Every Arcade puzzle and every Library puzzle is generated at S=1, regardless of grid size.

**To fix when prioritized** — touch points are:
- `findAlternativeSolution` in `generate.ts` — resize `regionCells` to the actual region count
- `repairBoard` — same for `regionCount`
- Validate against the original pre-generated S=2 JSON files (recoverable from git history; deleted from `data/` during 2026-04-28 cleanup)
- Once green, promote `S` back to a parameter and pick a scaling rule (e.g. `N >= 10 ? 2 : 1`)

---

## Generator perf note

S=1 generation is fast for small N (<5ms through ~12) but spikes at the largest sizes — one probe at N=15 took 4.4s; N=17 didn't finish in 5 minutes for one seed (variance is high — randomized backtracking). The prefetch cache hides the common case by generating in background while the player solves the current puzzle. Worst-case spike is still observable as a brief stall if the player advances rapidly.

If this becomes a real player issue, the next move is moving the generator to a Web Worker. The prefetch interface is already async-friendly so the swap is contained.

---

## Polish / follow-ups (non-blocking)

- [ ] Library batch persistence (currently only Arcade resumes; library batches reset on refresh)
- [ ] Cascade animation on the final boxle of a puzzle gets cut short when the next level swaps in. Acceptable for MVP.
- [ ] Generator at sizes 16+ benefits from background generation but rare worst-case freezes are still possible. Web Worker is the proper fix.
- [ ] Confirm "leaving via ☰ Menu mid-Arcade" UX feels right (currently: run state persists; player can resume from menu tile or start New Run).
