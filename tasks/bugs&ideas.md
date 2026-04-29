erase i bug when i say it's fixed.

- use the new box icons in the game over view...

## Console warnings to clean up (2026-04-28)

Surfaced in browser console during normal play. None are gameplay-breaking, but worth a sweep before/during Phase 5 mobile work since some indicate touch-event or render-loop issues that can bite harder on mobile.

- `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` — find and replace the `Clock` usage; likely in our `useFrame` integration or a vendored helper.
- `Cannot update a component (ResourceLoader) while rendering a different component (Box). To locate the bad setState() call inside Box, follow the stack trace …` — real React bug. Some `setState` is firing inside a render path in `Box.tsx`, mutating `ResourceLoader`. Move the offending call into `useEffect` or an event handler.
- `THREE.WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead.` — switch shadow map type (or accept the auto-fallback). Connects to perf phase Tier 4.1 (shadow downsize).
- `WebGL warning: drawArraysInstanced: Depth texture comparison requests (e.g. LINEAR) Filtering, but behavior is implementation-defined …` — driver-implementation warning. Investigate which depth texture is requesting linear filtering and switch to `NEAREST` for cross-platform consistency (mobile GPUs are where the "implementation-defined" bites).
- `MouseEvent.mozPressure is deprecated. Use PointerEvent.pressure instead.` and `MouseEvent.mozInputSource is deprecated. Use PointerEvent.pointerType instead.` — Firefox-only deprecations. Check `dragTracker.ts` and any other place reading legacy MouseEvent fields; switch to PointerEvent properties (we already do for `pressure` — verify nothing else still pulls the moz-prefixed fields).