import { generateBoard } from './generate'
import { decodeBoard } from '../utils/puzzle'
import type { DecodedBoard } from '../types/puzzle'

// Single-slot prefetch cache. Used by mode providers to generate the next
// puzzle in the background while the player is still solving the current one,
// so advancing between puzzles doesn't have to wait on synchronous generation.
//
// Why module-scoped: the cache survives React unmount/remount of mode providers
// (e.g. the user briefly visiting the menu mid-Arcade), and there's never more
// than one provider in play at a time. Two namespaces (arcade / library) keep
// the contents from colliding when the user switches modes.
//
// Caveat: JavaScript can't preempt a synchronous generation in progress. If
// the player advances rapidly and the in-flight generation is for a now-stale
// size, that generation runs to completion before the new one starts. Its
// result is discarded. This is the best we can do without web workers.

interface CacheEntry {
    size: number
    board: DecodedBoard
}

type Namespace = 'arcade' | 'library'

const cache: Record<Namespace, CacheEntry | null> = {
    arcade: null,
    library: null,
}

// The size we currently *want* prefetched. Updated atomically by callers; the
// in-flight generation re-checks this before committing its result.
const desiredSize: Record<Namespace, number | null> = {
    arcade: null,
    library: null,
}

function generateOnce(size: number): DecodedBoard | null {
    const raw = generateBoard(size)
    return raw ? decodeBoard(raw) : null
}

/**
 * Kick off background generation of a puzzle at `size` for `ns`. No-op if the
 * cache already has it, or if a matching generation is already in flight.
 * Re-targets in-flight work when called with a different size.
 */
export function prefetchPuzzle(ns: Namespace, size: number): void {
    if (cache[ns]?.size === size) return
    if (desiredSize[ns] === size) return

    const wasIdle = desiredSize[ns] === null
    desiredSize[ns] = size

    if (!wasIdle) {
        // An older generation is mid-flight or scheduled. Updating desiredSize
        // is enough — that generation will discard its (stale) result on
        // commit, and the next scheduling tick will pick up the new size.
        return
    }

    const tick = () => {
        const want = desiredSize[ns]
        if (want === null) return
        if (cache[ns]?.size === want) {
            desiredSize[ns] = null
            return
        }

        const board = generateOnce(want)
        // Recheck: desired might have changed while generating.
        const stillWant = desiredSize[ns]
        if (stillWant === want && board) {
            cache[ns] = { size: want, board }
            desiredSize[ns] = null
        } else if (stillWant !== want) {
            // Re-target: schedule another pass for the new desired size.
            setTimeout(tick, 0)
        } else {
            // Generation failed for the desired size. Stop trying — caller
            // will fall back to sync generate when they actually need it.
            desiredSize[ns] = null
        }
    }

    setTimeout(tick, 0)
}

/**
 * Returns a puzzle at `size`, draining the cache if it has a matching entry,
 * otherwise generating synchronously (which may briefly block). Caller is
 * expected to invoke prefetchPuzzle for the *next* size right after.
 */
export function takeOrGenerate(ns: Namespace, size: number): DecodedBoard | null {
    if (cache[ns]?.size === size) {
        const board = cache[ns]!.board
        cache[ns] = null
        return board
    }
    return generateOnce(size)
}

/** Drop cached/desired state for a namespace (e.g. on a fresh run). */
export function resetPrefetch(ns: Namespace): void {
    cache[ns] = null
    desiredSize[ns] = null
}
