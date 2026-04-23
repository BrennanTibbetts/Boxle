# Phase 3 — Onboarding

The game currently has zero explanation. New players will bounce without a tutorial. Requires Phase 1 (persistence) for the first-visit flag.

Stub exists at: `src/components/TutorialButton.tsx`

---

## 3.1 Tutorial Puzzle Design

- [ ] Select or hand-craft a fixed 4×4 puzzle that cleanly demonstrates all rules
- [ ] Map out the step-by-step script: what the game says and highlights at each step
  1. Regions — point to a colored area, explain each color is a region
  2. Star constraint — place exactly 1 star per row, column, and region
  3. Adjacency rule — no two stars may touch, even diagonally
  4. Marks — tap/click without placing a star to mark a cell as eliminated
  5. Hint — show the hint button and trigger a hint on this board
- [ ] Decide on presentation: speech bubble overlay? sidebar panel? step-by-step modal?

## 3.2 Tutorial Implementation

- [ ] Build a `TutorialLevel` component that loads the fixed puzzle and disables free play until each step is completed
- [ ] Build the step controller: advances only when the player performs the prompted action
- [ ] Highlight target cells with a pulsing ring or glow (reuse the existing highlight system if possible from `src/utils/hintRules.ts`)
- [ ] Allow skip at any point ("I know how to play")
- [ ] Wire up `src/components/TutorialButton.tsx` to open the tutorial

## 3.3 First-Visit Detection

- [ ] On app load, check persistence for a `hasSeenTutorial` flag
- [ ] If absent, show the tutorial before the daily puzzle starts
- [ ] Set the flag on tutorial complete or skip
- [ ] Tutorial button in HUD always re-opens it regardless of the flag
