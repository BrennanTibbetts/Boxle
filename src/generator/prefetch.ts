import GeneratorWorker from './generator.worker.ts?worker'
import type { GenerateResponse } from './generator.worker'
import type { DecodedBoard } from '../types/puzzle'
import {
    hasBundledPool,
    selectBundled,
    selectServer,
    fetchServerPool,
    resetPoolSelection,
} from './poolSource'

// Puzzle source for the mode providers. Boards now come from pre-generated
// pools (poolSource.ts): bundled JSON for free sizes (≤8×8), Supabase for paid
// sizes (9×9–18×18). The Web Worker generator below is kept as a *fallback*
// for any size a pool doesn't cover (e.g. a paid pool not yet uploaded, or a
// reader RLS rejects) — it no longer drives the common path. The public
// surface (takeOrGenerate / prefetchPuzzle / generateMany / resetPrefetch) is
// unchanged so the providers didn't need restructuring.
//
// Below this point is the worker-fallback machinery: a single-slot prefetch
// cache per namespace, backed by a pool of Web Workers, so a fallback
// generation never blocks the main thread.
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
// on the host side. Each worker processes its message queue serially.
//
// Parallelism: a *pool* of workers (sized to the machine, capped) backs all
// generation. Single-board prefetch/take requests round-robin across the pool;
// the batch path (generateMany) fans a whole intro ladder out at once, so a
// deep ladder generates concurrently across cores instead of one board at a
// time. See generateMany.

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

// Worker pool. Sized to leave a core for the main thread, capped so we don't
// spawn a wasteful number on many-core machines. Created lazily on first use.
const POOL_SIZE = (() => {
    const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4
    return Math.max(1, Math.min(4, cores - 1))
})()

let pool: Worker[] = []
let nextWorker = 0

function handleMessage(event: MessageEvent<GenerateResponse>) {
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

function ensurePool(): Worker[] {
    if (pool.length) return pool
    for (let i = 0; i < POOL_SIZE; i++) {
        const w = new GeneratorWorker()
        w.onmessage = handleMessage
        pool.push(w)
    }
    return pool
}

// Round-robin a worker off the pool. Each worker is its own OS thread, so jobs
// handed to different workers run concurrently; jobs piled on one worker still
// serialize. Round-robin keeps a batch evenly spread.
function pickWorker(): Worker {
    const p = ensurePool()
    const w = p[nextWorker % p.length]
    nextWorker++
    return w
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
    pickWorker().postMessage({ type: 'generate', requestId, size })
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
function prefetchViaWorker(ns: Namespace, size: number): void {
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
function takeFromWorker(ns: Namespace, size: number): Promise<DecodedBoard | null> {
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

// One worker generation that never dedupes against in-flight jobs: each call
// gets its own fresh board. Used by the generateMany fallback so a uniform-size
// batch yields distinct boards rather than N references to one in-flight job.
function generateOneViaWorker(ns: Namespace, size: number): Promise<DecodedBoard | null> {
    return new Promise<DecodedBoard | null>((resolve) => {
        const requestId = nextRequestId++
        pending.set(requestId, { ns, size, resolvers: [resolve] })
        pickWorker().postMessage({ type: 'generate', requestId, size })
    })
}

/**
 * Drop cached/pending state for a namespace (e.g. on a fresh run) and reseed
 * pool selection. Pending worker awaiters resolve with `null` so callers don't
 * hang. `seed` ties the pool sequence to the run (Infinite runId, Library
 * batchId) so it's deterministic and no-repeat-within-run.
 */
export function resetPrefetch(ns: Namespace, seed = 1): void {
    cache[ns] = null
    for (const [id, job] of pending) {
        if (job.ns !== ns) continue
        pending.delete(id)
        for (const resolve of job.resolvers) resolve(null)
    }
    resetPoolSelection(ns, seed)
}

// --- Public source API (pool-first, worker fallback) ---

// Resolve one board for a size: bundled pool (sync) → server pool (async) →
// worker generator (fallback). Shared by takeOrGenerate and generateMany.
//
// `dedupe` controls only the worker-fallback path: takeOrGenerate attaches to
// an in-flight same-size job (dedupe), while generateMany wants a distinct
// board per entry so a uniform-size batch doesn't collapse to one (no dedupe).
// Pool selection always yields distinct boards via pickIndex regardless.
function resolveOne(ns: Namespace, size: number, dedupe: boolean): Promise<DecodedBoard | null> {
    const fallback = () => (dedupe ? takeFromWorker(ns, size) : generateOneViaWorker(ns, size))
    if (hasBundledPool(size)) {
        const board = selectBundled(ns, size)
        return board ? Promise.resolve(board) : fallback()
    }
    return selectServer(ns, size).then((board) => board ?? fallback())
}

/**
 * Warm the next puzzle's source so advancing doesn't wait. Bundled sizes
 * resolve instantly so there's nothing to warm; paid sizes warm the Supabase
 * fetch (cached per session), and fall back to warming the worker only if no
 * server pool is available.
 */
export function prefetchPuzzle(ns: Namespace, size: number): void {
    if (hasBundledPool(size)) return
    void fetchServerPool(size).then((pool) => {
        if (!pool) prefetchViaWorker(ns, size)
    })
}

/**
 * Return a board at `size`, resolving from a pool when one exists and falling
 * back to the worker generator otherwise. Deterministic + no-repeat within a
 * run via the pool selection seeded in resetPrefetch.
 */
export function takeOrGenerate(ns: Namespace, size: number): Promise<DecodedBoard | null> {
    return resolveOne(ns, size, true)
}

/**
 * Resolve `sizes.length` boards in parallel (order preserved). Pool selection
 * dedupes within a run, so a uniform-size batch (Library) yields distinct
 * boards. Falls back to the worker per-size where no pool covers the size.
 */
export function generateMany(ns: Namespace, sizes: number[]): Promise<Array<DecodedBoard | null>> {
    return Promise.all(sizes.map((size) => resolveOne(ns, size, false)))
}
