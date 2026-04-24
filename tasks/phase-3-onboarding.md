# Phase 3 — Onboarding

Interactive tutorial that teaches Boxle from zero. Framework is complete; content is iterating.

Scope expanded beyond the original plan: instead of a single guided 4×4, the tutorial is a **three-level walkthrough** (4×4 → 5×5 → 6×6) with a **mode-provider architecture** that also backs Phase 4.

---

## 3.1 Mode Provider Architecture ✅ Done

Built during Phase 3 because a bolt-on tutorial would have leaked into the daily-mode code paths. Now the same pattern will host Arcade and Library in Phase 4.

- [x] `GameMode` type and `activeMode` + `setMode` on `useGame`
- [x] `src/modes/DailyModeProvider.tsx` — calls `useDailyPuzzles` + `usePersistenceSync`
- [x] `src/modes/TutorialModeProvider.tsx` — loads 3 fixed boards via `decodeBoard`, no persistence
- [x] `src/LevelManager.tsx` reduced to a pure renderer; puzzle loading removed
- [x] `src/interface/Interface.tsx` mounts providers and overlays conditionally based on `activeMode`

## 3.2 Tutorial Framework ✅ Done

- [x] `useTutorial` store: stepIndex, tutorialLevel, handPosition, handPressed, validBoxes, pendingAction, moveResolver, awaitingContinue, complete
- [x] Step types (`src/types/tutorial.ts`): `info` (rule slide + Continue), `system` (scripted demo), `player` (free-input with validBoxes allowlist)
- [x] `AnimatedMove` variants: `moveTo`, `pause`, `click` / `placeBoxle` (awaits user click, guided by hand), `autoMark` / `autoBoxle` (bot-executed, no user click)
- [x] `TutorialController.tsx` async script runner with abort handling on level transitions
- [x] `TutorialHandInScene.tsx` — 3D hand via drei `Html`; single `👆` emoji, scale+translate press animation, `pointerEvents: 'none'` so clicks pass to the box beneath
- [x] `TutorialOverlay.tsx` — prompt bubble with `ColoredText` renderer that styles color-label words (Yellow/Purple/Aqua/...) in the region's actual color, matching the hint system
- [x] Valid-click handling in `Box.tsx` (`handleTutorialClick`) — valid click → action; invalid click → nudge, no life loss
- [x] Hint button with idle-shake animation (no auto-reveal — always user-triggered)

## 3.3 Tutorial Content 🟡 Iterating

- [x] 4×4 "The Basics" — rule intro, single-box region, column forcing, cascade cleanup
- [x] 5×5 "Column Ownership" — bot demonstrates column ownership on Aqua, cascades to place Yellow + Purple automatically, player applies the technique to Red
- [x] 6×6 "Row & Column Ownership" — single-box warmup, cascade chains, column and row ownership on Aqua and Green
- [ ] First-time-player playtest; refine prompts / hint text based on confusion points
- [ ] Consider whether 5×5 needs a player-executed Aqua placement (currently fully bot-driven)

## 3.4 First-Visit Detection ✅ Done

- [x] `TutorialModal.tsx` checks `boxle-tutorial-seen` localStorage key on mount
- [x] Modal offers "Start Tutorial" / "Skip" — both set the flag
- [x] Tutorial button in HUD always opens the tutorial regardless of the flag
- [x] `TutorialEndScreen` on completion with "Play Today's Puzzle" CTA that calls `setMode(GameMode.DAILY)`

---

## Conventions locked in (apply to all future tutorial + hint content)

- **Region references use color labels.** Use the exact strings from `COLOR_LABELS` in `src/interface/HUD.tsx` (`Yellow`, `Purple`, `Aqua`, `Red`, `White`, `Green`, ...). The overlay's `ColoredText` component auto-styles them.
- **Spatial language for rows/columns.** "Leftmost column", "bottom row", "fourth column from the left" — never `column 1` / `row 0` in user-facing text.
- **HUD-matched styling.** Bebas Neue, translucent-glass background, `backdrop-filter: blur(6px)`. Don't re-skin tutorial UI with darker modal cards.
- **Bot vs. user execution.** If the lesson is *the concept* (column ownership, cascade cause-and-effect), use `autoMark` / `autoBoxle` so the demo flows smoothly. If the lesson is *the interaction* (how clicks work, muscle-memory for placement), use `click` / `placeBoxle` so the user executes.
- **Hint visual.** Simplified during Phase 3 — just dimming, no material-clone + elevated renderOrder tricks. Hint boxes use normal materials; non-hint boxes get dimmed via `dimMaterial` opacity tween. Preserve this simplicity.
