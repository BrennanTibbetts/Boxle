# Phase Sound — Game Feel Audio

Not strictly sequenced with Phases 2–6. Can be implemented any time after Phase 1. Depends only on game events that already exist.

---

## Design Decisions (settled)

- **Aesthetic:** Tactile and clicky. Physical, not musical.
- **Spatial:** Flat stereo only — no positional/directional audio.
- **Music:** None for now.
- **Cascade:** One sound per box, fires at the moment the box flips (locked to existing GSAP animation timing). Volume ramps up with distance from the source boxle — further boxes are louder.
- **Mark remove:** Softer, reversed-feel version of mark-place.
- **Life lost:** Jarring physical mistake — thud or buzz character.
- **Hint:** Very subtle.
- **Session complete vs. level complete:** TBD — left open until sound assets are in hand and we can hear what works.

---

## S1 — Asset Checklist (your job)

Source these yourself. See format notes below before you go hunting.

- [ ] `cascade-tick` — single short click/tap. Will play once per locking box. Needs to sound good repeated rapidly (10+ times in <1s). Dry, no reverb tail.
- [ ] `mark-place` — satisfying tactile click. Similar character to cascade-tick but slightly heavier/more deliberate.
- [ ] `mark-remove` — softer, reversed-feel of mark-place. Can be the same recording processed, or a separate lighter sound.
- [ ] `boxle-place` — satisfying placement sound. Distinct from mark. Slightly more "complete" in character.
- [ ] `life-lost` — jarring. Physical mistake. Thud, buzz, or hard click. Should feel like you hit something wrong.
- [ ] `hint` — very subtle. Soft tone, chime, or short whoosh. Easy to miss, that's fine.
- [ ] `session-complete` — TBD character. Hold off until other assets are in and you have a feel for the palette.

**Format:**
- Deliver as `.mp3` (universal browser support) or `.ogg` (smaller, also fine for web)
- Duration: < 500ms for all click sounds. `life-lost` can be up to ~1s. `session-complete` up to ~3s.
- 44.1 kHz, 16-bit, mono is fine (stereo not needed, saves bandwidth)
- No reverb tails on the click sounds — they will stack during cascade and reverb turns to mud

**Good search terms for Freesound / Zapsplat / similar:**
- cascade-tick: *wood tap, mechanical click, snap, tick*
- mark-place: *click, keyboard click, button press, thock*
- mark-remove: *soft click, muted tap*
- boxle-place: *pop, ding, positive click, confirm*
- life-lost: *thud, buzz, error, wrong, hit*
- hint: *chime, soft ding, whoosh, subtle notify*

---

## S2 — Implementation

### S2.1 Library

- [ ] Install Howler.js (`npm install howler`) — handles Web Audio context unlock on mobile, sprite support, volume control, cross-browser compat
- [ ] Add `@types/howler` for TypeScript

### S2.2 Sound Store

- [ ] Create `src/stores/useSound.ts` — Zustand store that:
  - Loads all sound files from `public/sounds/` on init
  - Exposes `play(soundName: SoundName, opts?: { volume?: number })` 
  - Exposes `muted` boolean + `toggleMute()` (persist mute preference to localStorage)
  - Handles Howler's mobile audio context unlock automatically

### S2.3 Wire Sounds to Events

All wiring happens at the call sites, not inside the store.

> **Prep step (deferred from the 2026-04-28 cleanup audit):** before wiring sounds into `Box.tsx`, extract the tangled animation/overlay logic into sub-hooks: `useBoxStateAnimation`, `useWrongPlacementFlash`, `useDimOverlay`. The sound call sites below land in exactly those spots, so the extraction + wiring is best done as one PR rather than two. Drag-tracker module + GSAP unmount-cleanup + `pointerEnter` guard reorder are already shipped.

- [ ] **`src/components/Box.tsx`** — cascade tick  
  In the `BoxState.LOCK` branch of the `boxState` useEffect, after the GSAP tween is set up, call `useSound.getState().play('cascade-tick', { volume: ... })` with the same `delay` already computed there. Volume = `clamp(0.3 + distance * 0.12, 0.3, 1.0)` (or tune to taste).

- [ ] **`src/components/Box.tsx`** — mark-place and mark-remove  
  In `handleClick`, after `toggleMark` is called. Derive which sound to play from `boxState` at the moment of the click: `BLANK → MARK` plays mark-place, `MARK → BLANK` plays mark-remove.

- [ ] **`src/components/Box.tsx`** — boxle-place  
  In `handleClick` and `handleDoubleClick`, after `placeBoxle` is called and only if the state wasn't already `BOXLE` (guard against double-fire). Play `boxle-place`.

- [ ] **`src/stores/useGame.ts`** — life-lost  
  In `placeBoxle`, at the point where a wrong placement is detected and lives are decremented. Play `life-lost`.

- [ ] **`src/interface/HUD.tsx` or `useHint.ts`** — hint  
  Wherever the hint action is triggered. Play `hint`.

- [ ] **`src/interface/EndScreen.tsx`** — session-complete / game-over  
  On mount, check whether it's a win or loss and play the appropriate sound. TBD until assets exist.

### S2.4 Mute Control

- [ ] Add a mute toggle button to the HUD (small speaker icon, top corner)
- [ ] Persist mute state in localStorage (add to `usePersistence.ts` schema or handle directly in `useSound.ts`)

---

## Open Questions

- Session-complete sound character — decide once other assets are in hand.
- Whether cascade volume ramp (`0.3 → 1.0`) or pitch ramp sounds better — start with volume, evaluate and switch to pitch ramp if it feels more satisfying.
- Mute button placement in HUD — coordinate with HUD layout changes coming in Phase 2/3.
