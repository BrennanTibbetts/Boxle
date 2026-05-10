import GeneratorWorker from './generator.worker.ts?worker'
import type { GenerateResponse } from './generator.worker'
import type { DecodedBoard } from '../types/puzzle'

// Single-slot prefetch cache per namespace. Used by mode providers to generate
// the next puzzle in the background while the player is still solving the
// current one, so advancing between puzzles doesn't have to wait on
// generation. Generation itself runs in a Web Worker (see generator.worker.ts)
// so the main thread is never blocked, no matter the size.
//
// Why module-scoped: the cache survives React unmount/remount of mode
// providers (e.g. the user briefly visiting the menu mid-Infinite), and
// there's never more than one provider in play at a time. Two namespaces
// (infinite / library) keep the contents from colliding when the user
// switches modes.
//
// Caveat: JavaScript can't preempt a generation in progress, even in a worker
// — so if the player retargets to a new size while a stale generation is
// in flight, that generation runs to completion and its result is discarded
// on the host side. The worker processes its message queue serially.

interface CacheEntry {
    size: number
    board: DecodedBoard
}

type Namespace = 'infinite' | 'library'

interface PendingJob {
    ns: Namespace
    size: number
    // Awaiters from takeOrGenerate. A pure prefetch has zero resolvers; its
    // result lands in the cache instead.
    resolvers: Array<(board: DecodedBoard | null) => void>
}

const cache: Record<Namespace, CacheEntry | null> = {
    infinite: null,
    library: null,
}

const pending = new Map<number, PendingJob>()
let nextRequestId = 1

let worker: Worker | null = null

function getWorker(): Worker {
    if (worker) return worker
    worker = new GeneratorWorker()
    worker.onmessage = (event: MessageEvent<GenerateResponse>) => {
        const { type, requestId, board } = event.data
        if (type !== 'result') return
        const job = pending.get(requestId)
        if (!job) return // stale — request was discarded by the host
        pending.delete(requestId)
        if (job.resolvers.length > 0) {
            for (const resolve of job.resolvers) resolve(board)
        } else if (board) {
            // Pure prefetch with no awaiters — fill the cache slot.
            cache[job.ns] = { size: job.size, board }
        }
    }
    return worker
}

function findInflight(ns: Namespace, size: number): number | null {
    for (const [id, job] of pending) {
        if (job.ns === ns && job.size === size) return id
    }
    return null
}

function postGenerate(ns: Namespace, size: number): number {
    const requestId = nextRequestId++
    pending.set(requestId, { ns, size, resolvers: [] })
    getWorker().postMessage({ type: 'generate', requestId, size })
    return requestId
}

/**
 * Kick off background generation of a puzzle at `size` for `ns`. No-op if the
 * cache already has it or a matching generation is already in flight.
 *
 * If a stale prefetch (no awaiters) for a different size is in flight, its
 * result will be discarded on arrival — we don't try to cancel it on the
 * worker side since JS can't preempt mid-generation.
 */
export function prefetchPuzzle(ns: Namespace, size: number): void {
    if (cache[ns]?.size === size) return
    if (findInflight(ns, size) !== null) return

    // Drop any stale pure-prefetch jobs for this namespace at other sizes —
    // the worker will still finish them, but we'll ignore the result.
    for (const [id, job] of pending) {
        if (job.ns === ns && job.size !== size && job.resolvers.length === 0) {
            pending.delete(id)
        }
    }

    postGenerate(ns, size)
}

/**
 * Returns a puzzle at `size`, draining the cache if it has a matching entry,
 * otherwise awaiting a worker generation. Caller is expected to invoke
 * prefetchPuzzle for the *next* size right after.
 *
 * If a generation for this `(ns, size)` is already in flight (e.g. from a
 * prior prefetch), this attaches to that job rather than starting a new one.
 */
export function takeOrGenerate(ns: Namespace, size: number): Promise<DecodedBoard | null> {
    if (cache[ns]?.size === size) {
        const board = cache[ns]!.board
        cache[ns] = null
        return Promise.resolve(board)
    }
    return new Promise((resolve) => {
        let id = findInflight(ns, size)
        if (id === null) id = postGenerate(ns, size)
        pending.get(id)!.resolvers.push(resolve)
    })
}

/**
 * Drop cached/pending state for a namespace (e.g. on a fresh run). Pending
 * awaiters resolve with `null` so callers don't hang.
 */
export function resetPrefetch(ns: Namespace): void {
    cache[ns] = null
    for (const [id, job] of pending) {
        if (job.ns !== ns) continue
        pending.delete(id)
        for (const resolve of job.resolvers) resolve(null)
    }
}
