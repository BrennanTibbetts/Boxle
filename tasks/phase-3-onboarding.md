# Phase 3 — Onboarding

**Status: closed for now.** Pinned on real playtester feedback before we revisit.

On 2026-04-23 the interactive tutorial system was **gutted**. The guided three-level walkthrough had become too complex for the value it delivered. The current onboarding is a static rules slide; whether we need more than that is a question for first-time-player observation, not for us guessing.

---

## What shipped

- [x] `src/interface/RulesModal.tsx` — static rules slide. Explains regions, rows/columns, adjacency, mark/boxle interaction in HUD-matched styling
- [x] First-visit auto-open via `boxle-rules-seen` localStorage key (`useFirstVisitRules()` inside `RulesModal.tsx`)
- [x] `?` button in HUD re-opens anytime, independent of the flag

## What was removed (do not reintroduce without a conversation)

- `src/tutorial/` — entire directory (controller, scripts, overlay, in-scene hand cursor)
- `src/modes/TutorialModeProvider.tsx`
- `src/stores/useTutorial.ts`, `src/types/tutorial.ts`, `src/components/TutorialButton.tsx`
- `.tutorial-*` CSS classes
- `GameMode.TUTORIAL` (enum now `DAILY` / `ARCADE` / `LIBRARY`)

`activeMode` / `setMode` remain in `useGame` as Phase 4 scaffolding even though Daily is the only active mode today.

## Pinned — needs real playtesters

- [ ] Observe first-time players with just the `RulesModal`. Does the rules slide get them to their first correct placement? Where do they stall?
- [ ] Based on that data, decide whether to reintroduce a lightweight guided moment (e.g. a single hint auto-opened on the first 4×4 board) or leave rules-only.

Do not rebuild the full interactive tutorial without that playtest data in hand.

---

## Conventions still in force

These were locked in during the original Phase 3 work and apply to hint text, rules copy, and any future user-facing explanation of regions/rows/cols:

- **Region references use color labels.** Use the exact strings from `COLOR_LABELS` in `src/interface/HUD.tsx` (`Yellow`, `Purple`, `Aqua`, `Red`, `White`, `Green`, ...).
- **Spatial language for rows/columns.** "Leftmost column", "bottom row", "fourth column from the left" — never `column 1` / `row 0` in user-facing text.
- **HUD-matched styling.** Bebas Neue, translucent-glass background, `backdrop-filter: blur(6px)`. Don't re-skin with darker modal cards.
- **Hint visual simplicity.** Dimming only — no material-clone + elevated renderOrder tricks. Hint boxes use normal materials; non-hint boxes get dimmed via `dimMaterial` opacity tween.
