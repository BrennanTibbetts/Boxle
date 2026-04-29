# Phase 5 — Mobile-Friendly Web

**Status: 🟡 In progress (started 2026-04-28).** Code-level work for 5.1–5.5 is done; 5.6 (real-device perf validation) is deferred until physical hardware is available. Prerequisite for Phase 6 (Monetization). Boxle today is desktop-playable but **mobile-unplayable**: the placement gesture is `onDoubleClick`, which has no touch equivalent. Since the share card is the viral surface and shared links are tapped from phones, monetizing before fixing this funnels paid traffic to a broken site.

This phase is web-only. iOS native is still a future Swift rewrite — but the web app must be a real mobile experience first.

---

## Goals

1. **Playable on mobile web** — touch gesture model that works without keyboard modifiers or double-click.
2. **Looks right in portrait** — adaptive camera, no clipped HUD, no `100vh` jank from iOS Safari URL bar.
3. **Feels native enough to share** — safe-area-inset, theme color, optional `navigator.share()`.
4. **Performs on mid/low-end Android** — perf measurement on a real device, then act on findings.

Out of scope: PWA install, full offline support, push notifications, native iOS app. Those stay deferred.

---

## 5.1 Touch gesture model (BLOCKER — UX redesign)

Today, [src/components/Box.tsx](../src/components/Box.tsx) uses:
- **Click** → toggle mark
- **Shift+click** or **double-click** → place boxle
- **Right-click / long-press contextmenu** → place boxle (current touch fallback, unreliable)
- **Hover-drag with shift** → multi-mark

None of those map cleanly to a phone. Need a touch interaction model that's discoverable, fast, and matches the rules copy.

**Open design question — pick one before implementing:**
- **Option A — long-press to place:** tap = mark, hold ~300ms = place. Familiar from mobile games. Requires a visible charge animation so the player knows it's happening (this overlaps with the "click-and-hold boxle placement" idea already in PRODUCT_DIRECTION's Future Ideas — opportunity to ship that polish here).
- **Option B — mode toggle:** HUD button toggles "mark mode" vs "place mode"; tap places per mode. More explicit, less elegant. Cheaper to build.
- **Option C — two-tap commit:** first tap previews a boxle, second tap on the same box commits. Single tap elsewhere clears the preview. No timing-based gesture.

Recommendation: **A** — best feel, doubles as the polish item already in the backlog. **C** is the safe fallback if long-press testing surfaces accidental fires.

- [x] Decide gesture model — **shipped Option A (long-press)** per the doc's default
- [x] Implement in [src/components/Box.tsx](../src/components/Box.tsx) via new [src/utils/longPressTracker.ts](../src/utils/longPressTracker.ts) singleton (350ms threshold, 10px movement-cancel). Touch path arms long-press alongside drag-mark; mouse path is byte-identical to before
- [x] Charge feedback: emissive group-colored cube grows from scale 0 → 0.5 over the press window using the existing `boxleMaterial`. Snaps away on commit (boxle takes over), fades out on cancel
- [x] [src/interface/RulesModal.tsx](../src/interface/RulesModal.tsx) copy: "Tap to rule out / Hold on a box to place" on mobile; desktop copy unchanged
- [x] Drag-to-mark on touch — verified via `dragTracker.ts` `pressure > 0` path; long-press cancellation runs as a sibling listener so the two gestures coexist
- [x] iOS suppression: `touch-action: none` already on `.r3f`; added `-webkit-touch-callout: none` and `-webkit-tap-highlight-color: transparent` to suppress callouts and tap flashes

---

## 5.2 Camera & viewport (BLOCKER)

Camera assumes landscape aspect. Portrait squashes the board.

- [x] [src/CameraManager.tsx](../src/CameraManager.tsx) — `requiredCameraY(gridSize, aspect, fov)` derives the minimum y to fit the grid at the current aspect. We `Math.max` with the leva-controlled base so landscape stays exactly as before; portrait pulls the camera back proportionally. **Subscriptions install once** (`[camera]` dep only); aspect/leva props read via refs and resize is handled in a separate effect — the original version put `size.width/height` on the subscription effect, which torn-down/re-installed subscriptions on every layout shift and silently dropped portrait level transitions. Both effects target a shared `targetRef` so resize-mid-transition still drives both y and z to the right destination.
- [x] [src/Display.tsx](../src/Display.tsx) — already aspect-aware; reads `cam.position.y` directly so it tracks the new dynamic camera without changes
- [ ] Manual test at 4×4 through 18×18 in portrait at iPhone SE (375×667) and a tall Android (393×873) — needs real device or browser devtools mobile emulation pass
- [x] iOS Safari `100vh` trap: `100dvh` (with `100vh` fallback) on html/body/#root/rules-panel in [src/style.css](../src/style.css)
- [x] `viewport-fit=cover` added to `index.html`; HUD bottom and corner-button positions wrap in `calc(... + env(safe-area-inset-*))` so they clear the notch/home-indicator

---

## 5.3 HUD & layout responsive pass (MAJOR)

Current responsive coverage is partial — RulesModal, MainMenu tiles, and LibraryTierPicker have `@media (max-width: 768px)` rules; **HUD does not**.

- [x] HUD bottom bar: at ≤768px, drops `hud-label` text, shrinks gap/padding, prefixes the level value with a small "L" so the value still has context. `max-width: calc(100vw - 16px)` prevents overflow; an additional `≤360px` rule tightens further for the iPhone SE-class width
- [x] HUD `?`, hint, and `☰ Menu` corner buttons: `min-width/min-height: 44px` on mobile; flex-centered content
- [x] `:active` and `:focus-visible` companions added to `.hud-btn`, `.menu-tile`, and `.library-tier-card` so touch users see press feedback without hover
- [x] Rules side-panel: stays gated by `useCentered = onMenu || isMobile` in [src/interface/RulesModal.tsx](../src/interface/RulesModal.tsx) — never renders the side-panel on touch viewports
- [x] HintDescription `bottom: 80px` → `calc(78px + env(safe-area-inset-bottom))` on mobile, with `white-space: normal` and `max-width: calc(100vw - 24px)` so longer hints wrap above the HUD instead of clipping
- [x] EndScreen / StatsModal at 320–480px: `≤480px` rule tightens `.end-card`, `.end-title`, `.end-share-grid`, `.end-actions`/`.end-btn`, and `.stats-card`/`.stats-title`/`.stats-row`/`.stats-value`. LibraryBatchComplete/LibraryGameOver inherit the existing `.end-card` styles (visual review still wanted on real devices)

---

## 5.4 PWA-ish polish (MINOR but cheap)

- [x] `<meta name="theme-color" content="#151517">` added — matches body background
- [x] `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style="black-translucent"`, `apple-mobile-web-app-title="Boxle"` added for "Add to Home Screen" path
- [x] Pinch-zoom left default-on (more accessible) — gesture model survives pinch fine since `.r3f` already has `touch-action: none`
- [x] Manifest + service worker: deferred to post-Phase 7 as planned

---

## 5.5 Native share (MINOR)

Today the share button uses `navigator.clipboard.writeText()` only. On mobile, native share is the higher-conversion path.

- [x] `shareOrCopy(text)` helper in [src/utils/share.ts](../src/utils/share.ts) — feature-detects `navigator.share`, treats `AbortError` (user dismissed sheet) as success, falls through to clipboard if share is unavailable or throws
- [x] Single "Share" button: shows "Copied!" only when the clipboard fallback path actually ran (avoids fake feedback when the native sheet was used)
- [x] Wired in [src/interface/EndScreen.tsx](../src/interface/EndScreen.tsx) and [src/interface/DailyPerformanceModal.tsx](../src/interface/DailyPerformanceModal.tsx)

---

## 5.6 Mobile perf validation (MAJOR — gates phase-perf Tier 2/3)

**Status:** ⏸️ Deferred — requires physical hardware not available in this dev environment. The decision tree below is the action plan once a Pixel 5a-class Android and an iPhone SE 2nd/3rd gen are in hand. Code changes from 5.1–5.5 don't introduce new render cost beyond a single per-box `chargeMesh` (visible only during a long-press, hidden via scale 0 otherwise — same draw-call profile as the existing wrong-placement mesh).

Current perf baseline ([phase-perf.md](phase-perf.md)) is M1 MBP only. The Tier 2/3 perf work is explicitly gated on real low-end-device measurement.

- [ ] Measure on a Pixel 5a or older Android (real device, not Chrome devtools throttling)
- [ ] Measure on iPhone SE 2nd/3rd gen
- [ ] Capture: FPS, frame time, GPU time, draw calls, thermal behavior over 5 minutes of play
- [ ] Decision tree:
  - **≥ 60 FPS sustained** → ship as-is, defer perf Tiers 2/3
  - **30–60 FPS** → ship Tier 4.1 (shadow map 1024² → 512²) and re-measure
  - **< 30 FPS** → pull Tier 2 (overlay folding) and possibly Tier 3 (InstancedMesh) into this phase
- [ ] Re-measure generator stalls on cellular / mid-tier CPU at sizes 14+. If pathological cases visibly stall the UI, escalate to Web Worker (see phase-4-new-modes.md generator perf note).

---

## 5.7 What we're explicitly NOT doing in Phase 5

- Native iOS app — separate Swift project, far future.
- Service worker / offline play — defer.
- Landscape lock or portrait lock — let the user rotate; both should work.
- Rebuilding the interactive tutorial for mobile — the rules modal is the answer for now (see phase-3-onboarding.md).
- Account system — still Phase 7 territory (was Phase 6).

---

## Acceptance criteria

Phase 5 ships when:
- A first-time user on iPhone SE in portrait can: open the site, read the rules, complete a 4×4 daily puzzle, and tap "Share."
- The same flow works on a mid-tier Android (Pixel 5a or equivalent) at sustained ≥ 30 FPS.
- HUD never overflows or clips at 320px width.
- No `100vh` flash when the iOS Safari URL bar shows/hides.
- Tap targets meet 44px minimum.

Once green, Phase 6 (Monetization) becomes the next-up.
