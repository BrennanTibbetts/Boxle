// Bundled free-tier puzzle pools (sizes 5×5–8×8). These ship in the client so
// the free experience has zero network dependency. They reuse the existing
// daily pools (valid_puzzles_N.json) — same `{ Board }` RawBoard format, same
// generator, already shipped and proven unique-solution — rather than
// maintaining a second set of files.
//
// Keyed by grid size for O(1) lookup by the client pool source
// (src/generator/poolSource.ts). The paid sizes (9×9–18×18) are NOT bundled;
// they're served from Supabase (see boxle-backend puzzle_pools).

import puzzles5 from './valid_puzzles_5.json'
import puzzles6 from './valid_puzzles_6.json'
import puzzles7 from './valid_puzzles_7.json'
import puzzles8 from './valid_puzzles_8.json'

// Largest size bundled in the client. Sizes above this resolve from Supabase.
export const BUNDLED_MAX_SIZE = 8

export const bundledPools = {
    5: puzzles5,
    6: puzzles6,
    7: puzzles7,
    8: puzzles8,
}
