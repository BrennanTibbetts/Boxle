// Free-tier depth thresholds for the $2.99 unlock (Phase 7).
//
// Sizes ≤ threshold play free; sizes > threshold require premium. These
// values are placeholders pending real playtesting — keep them here so a
// feel-tuning pass is a one-line edit. Read by canPlayAt in
// src/utils/gates.ts and surfaced in the upsell modal copy.
//
// Paid ceilings (the absolute cap on each mode) live in
// src/config/puzzleSize.ts (MAX_PUZZLE_SIZE) and are read by ARCADE_MAX_SIZE
// and LIBRARY_MAX_SIZE in the run stores.

export const FREE_ARCADE_MAX_SIZE = 8
export const FREE_LIBRARY_MAX_SIZE = 8
