// Free-tier depth thresholds for the $2.99 unlock (Phase 7).
//
// Sizes ≤ threshold play free; sizes > threshold require premium. These
// values are placeholders pending real playtesting — keep them here so a
// feel-tuning pass is a one-line edit. Read by canPlayAt in
// src/utils/gates.ts and surfaced in the upsell modal copy.
//
// Paid ceilings (the absolute cap on each mode) live with the run stores,
// not here, because they're tied to generator capability rather than
// pricing: ARCADE_MAX_SIZE in src/stores/useArcadeRun.ts (currently 14, set
// by the S=1 generator limit) and LIBRARY_MAX_SIZE in
// src/stores/useLibraryRun.ts (18). When the S>1 generator track lands,
// those ceilings move up; these free thresholds are the pricing knob.

export const FREE_ARCADE_MAX_SIZE = 2
export const FREE_LIBRARY_MAX_SIZE = 6
