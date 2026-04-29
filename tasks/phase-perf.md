# Phase Perf — Draw-Call Reduction

Independent of Phases 2–6. Pure optimization work. All wins here are for low-end mobile / older hardware — desktop and current iPhones are already comfortably fast (M1 MBP runs 121 FPS at ~2ms CPU / 0ms GPU).

**Gating:** don't pull this work forward without measurement on a real low-end device (Pixel 5a / older iPhone SE). If the floor device already hits 60 FPS, defer.

---

## Baseline (2026-04-23)

Measured on M1 MBP, 5×5 grid, 2 levels visible (current + next preview):

- **Draw calls:** 247 (idle, no hint)
- **CPU:** ~1.9 ms/frame
- **GPU:** ~0.0 ms/frame
- **Triangles:** ~26k

Per-box mesh count (after Tier 1, already shipped): 3 base meshes (box + child glow + mark) + 0–2 overlays depending on hint/wrong-placement state. Main box casts shadow, so adds one shadow-pass draw per box.

**Tier 1 (shipped):** shared dim/wrong materials, conditional overlay mounts, dim scale matches boxle extent when a boxle is placed. See [src/components/Box.tsx](../src/components/Box.tsx), [src/stores/useResource.ts](../src/stores/useResource.ts), [src/stores/useHint.ts](../src/stores/useHint.ts).

---

## Tier 2 — Fold overlays into the box material

**Estimated savings:** ~50 draw calls during hints; ~25 at all times if the glow is folded in too.

### T2.1 Fold dim + wrong into the base material

Replace the separate dim/wrong meshes with a uniform-driven tint on the main box material. Two uniforms: `uDimAmount` (0–1) and `uWrongAmount` (0–1). Tint fragment color toward black by `uDimAmount` and toward red by `uWrongAmount`.

- [ ] Patch the shared group material via `onBeforeCompile` — inject two uniforms and a fragment-color mix at the end of the shader.
- [ ] Use `onBeforeRender` per-mesh to push the current box's dim/wrong values into the uniforms before draw. The uniforms are per-material but `onBeforeRender` fires per-mesh, so we can swap values just in time.
- [ ] Drive dim amount from `hintActive && !hintRole` (same condition as today's dim mesh). Drive wrong amount from `isWrongPlacement` plus the existing GSAP flash timeline (animate a ref the `onBeforeRender` reads from).
- [ ] Remove the dim mesh + wrong mesh from `Box.tsx` entirely.
- [ ] Remove the shared dim/wrong materials from `useResource.ts`.
- [ ] Keep the `boxle` material shader in sync — the boxle variant also needs the tint when a hint dims a placed boxle.

**Risks:** `onBeforeCompile` is fragile across Three.js versions. A custom shader chunk might be cleaner than injecting into MeshStandardMaterial — evaluate both before picking.

### T2.2 Fold the glow into the boxle shader

The glow is currently a back-side additive cube child of the boxle mesh — always a separate draw call whenever a boxle is placed.

- [ ] Extend the boxle material with a pseudo-glow: inflate along normals in the vertex shader, apply additive-like behavior via fragment color and blending, or use a fresnel rim-light.
- [ ] Remove the `glowRef` mesh and `glowMaterial` entirely.
- [ ] Preserve the hover interaction — glow scale currently animates on pointer enter via GSAP. Replace with a uniform the `onBeforeRender` writes based on a per-mesh "hovered" flag.

**Risks:** Fresnel won't match the current additive-blended look exactly. Get design sign-off on the visual change before committing.

---

## Tier 3 — InstancedMesh per level

**Estimated savings:** 5×5 level goes from ~125 draw calls to ~5. With 2–3 levels visible, 247 → roughly 40.

This is the real win but also the real refactor. Touches pointer events, animation, and materials simultaneously. Strongly recommend splitting into the sub-tasks below and shipping them one at a time.

### T3.1 Replace per-box meshes with InstancedMesh (static)

- [ ] In `Level.tsx`, render a single `<instancedMesh>` for base boxes and a second for marks. Instance count = `gridSize * gridSize`.
- [ ] Compute instance matrices once at mount based on row/col position. Store row/col → instanceId map for later lookup.
- [ ] Per-instance color via `InstancedBufferAttribute` for the region color. Patch the material to read `instanceColor`.
- [ ] At this point animation and events are broken — that's fine, fix in next sub-tasks.

### T3.2 Per-instance animation

- [ ] Move all per-box GSAP tweens into instance-matrix updates. Maintain a per-instance state buffer (rotation, scale) in a plain array keyed by instanceId.
- [ ] Run tweens against that buffer. Each frame, compose scale + rotation + position into `instanceMatrix` and mark `needsUpdate`.
- [ ] Boxle spin goes in the same per-instance state, updated in `useFrame`.
- [ ] The cascade-lock delayed flip still works — GSAP tweens plain numbers, so `gsap.to(state[instanceId], { rotationX: ..., delay })` is the pattern.

### T3.3 Per-instance pointer events

- [ ] Attach pointer handlers to the `<instancedMesh>` itself. Use `event.instanceId` to route the event to the right row/col (via the map from T3.1).
- [ ] Preserve the drag-mark flow (shift-key, hover-drag, pointerdown threshold) from the current `Box.tsx` — just thread through `instanceId` instead of closure-captured row/col.
- [ ] Verify shift-click, double-click, right-click, and pointer-enter-while-dragging all still work.

### T3.4 Shadow pass

- [ ] `InstancedMesh` supports shadow casting natively with `castShadow`. Verify the shadow map renders correctly after T3.1.

### T3.5 Fold Tier 2 into Tier 3

If T3 ships after T2, the dim/wrong/glow uniforms become per-instance attributes (`InstancedBufferAttribute`) instead of per-mesh `onBeforeRender` writes. Cleaner.

---

## Tier 4 — Speculative

Only worth exploring after T3 ships and measurements show where the next bottleneck is.

- **Shadow map downsize:** 1024² is cheap on desktop but dominant on mobile. If GPU time spikes on low-end, 512² is often indistinguishable.
- **Merge all marks into the box instanced mesh:** the mark is currently a separate mesh flipped below the box. Could be a UV-offset face on the box itself, removing the whole marks instanced mesh.
- **Frustum culling hints:** everything's in view by default; probably nothing to do unless the camera zooms out for a future feature.
- **Skip the preview level's shadow pass:** the next-level preview is non-interactive and partially off-screen. `castShadow = false` on its boxes would cut its shadow-pass cost to zero.

---

## Open Questions

- Does the visual difference from Tier 2's shader-based glow matter? Current additive glow is a signature look — worth preserving if Tier 3 already hits our draw-call goal without touching it.
- Low-end mobile target: what's the actual device floor we care about? Decision gates whether Tier 3 is worth the risk.
- Re-measure baseline on actual low-end hardware (Pixel 5a / older iPhone SE) before committing to Tier 3. If the floor device already hits 60 FPS, defer.
