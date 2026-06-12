// Pool-backed puzzle source. Resolves a board of a given size from a
// pre-generated pool instead of generating it live:
//   - free sizes (≤8×8): bundled in the client (data/pools.js), resolved
//     synchronously
//   - paid sizes (9×9–12×12): served from Supabase (puzzle_pools), fetched
//     once per size per session and cached in memory
//
// Selection is deterministic and no-repeat-within-run: seeded by a per-run
// seed + the number of boards already served at that size, so the same run
// reproduces the same sequence and a run never serves the same pool entry
// twice (until the pool is exhausted, after which repeats are allowed — the
// same trade Daily already accepts).
//
// prefetch.ts routes through this and falls back to the Web Worker generator
// only when no pool covers a size (e.g. a paid pool not yet uploaded, or a
// transient fetch error). Pool reads are NOT premium-gated — delivery is open
// to everyone, including anonymous players; the $2.99 unlock is enforced
// client-side by canPlayAt(), so a non-premium player never reaches the paid
// sizes in the UI in the first place.

import { decodeBoard, seededRandom } from '../utils/puzzle'
import { getSupabase } from '../utils/supabase'
import type { RawBoard, RawPuzzle, DecodedBoard } from '../types/puzzle'
import { bundledPools as bundledPoolsRaw, BUNDLED_MAX_SIZE } from '../../data/pools.js'

// The two pool-consuming modes (Daily reads its own bundled pool directly).
// Also imported by prefetch.ts — one definition for the generator layer.
export type Namespace = 'infinite' | 'library'

const bundledPools = bundledPoolsRaw as Record<number, RawPuzzle[]>

export function hasBundledPool(size: number): boolean {
    return size <= BUNDLED_MAX_SIZE && (bundledPools[size]?.length ?? 0) > 0
}

// --- Server pool cache (paid sizes) ---

const serverCache = new Map<number, RawBoard[]>()
const serverInflight = new Map<number, Promise<RawBoard[] | null>>()

/**
 * Fetch (and cache) the Supabase pool for a paid size. Returns null if the
 * pool is empty or the request errors — callers treat null as "no pool, fall
 * back to the generator". Reads are open (not premium-gated), so the common
 * null case is now a not-yet-uploaded size or a transient network error.
 * Cached for the session so a run doesn't refetch the same size.
 */
export function fetchServerPool(size: number): Promise<RawBoard[] | null> {
    const cached = serverCache.get(size)
    if (cached) return Promise.resolve(cached)
    const inflight = serverInflight.get(size)
    if (inflight) return inflight

    const promise = (async () => {
        const supabase = await getSupabase()
        const { data, error } = await supabase
            .from('puzzle_pools')
            .select('board')
            .eq('size', size)
            .order('idx', { ascending: true })

        if (error || !data || data.length === 0) {
            if (error) console.warn('[poolSource] server pool fetch failed', { size, error })
            return null
        }
        const boards = data.map((row) => (row as { board: RawBoard }).board)
        serverCache.set(size, boards)
        return boards
    })()

    serverInflight.set(size, promise)
    // Drop the in-flight handle once settled (success is cached; failure should
    // be retryable on the next request rather than stuck returning null).
    promise.finally(() => serverInflight.delete(size))
    return promise
}

// --- Deterministic no-repeat selection ---

interface SelectionState {
    seed: number
    served: Map<number, Set<number>>
}

const selection: Record<Namespace, SelectionState> = {
    infinite: { seed: 1, served: new Map() },
    library: { seed: 1, served: new Map() },
}

/**
 * Reset per-namespace selection at the start of a run/batch. `seed` ties the
 * sequence to the run (Infinite runId, Library batchId) so it's reproducible;
 * pass a stable per-run value.
 */
export function resetPoolSelection(ns: Namespace, seed: number): void {
    selection[ns] = { seed: seed || 1, served: new Map() }
}

// Pick a pool index deterministically from (seed, size, position), skipping
// indices already served this run. When every index has been served, the set
// resets and repeats become allowed.
function pickIndex(ns: Namespace, size: number, poolLen: number): number {
    const state = selection[ns]
    let served = state.served.get(size)
    if (!served) {
        served = new Set()
        state.served.set(size, served)
    }
    if (served.size >= poolLen) served.clear()

    const position = served.size
    const rng = seededRandom(state.seed * 1_000_003 + size * 1009 + position + 1)
    let i = Math.floor(rng() * poolLen) % poolLen
    while (served.has(i)) i = (i + 1) % poolLen
    served.add(i)
    return i
}

/** Synchronously resolve a bundled (free-size) board, or null if none. */
export function selectBundled(ns: Namespace, size: number): DecodedBoard | null {
    const pool = bundledPools[size]
    if (!pool || pool.length === 0) return null
    return decodeBoard(pool[pickIndex(ns, size, pool.length)].Board)
}

/** Resolve a server (paid-size) board, or null if no pool is available. */
export async function selectServer(ns: Namespace, size: number): Promise<DecodedBoard | null> {
    const pool = await fetchServerPool(size)
    if (!pool || pool.length === 0) return null
    return decodeBoard(pool[pickIndex(ns, size, pool.length)])
}
