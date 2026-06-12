import { getSupabase } from './supabase'
import useAuth from '../stores/useAuth'
import usePersistence, {
    type InfiniteSave,
    type InfiniteStats,
    type DailySave,
    type DailyStats,
    type LibraryProgress,
    type LibraryStats,
    type ModeStats,
} from '../stores/usePersistence'
import { Phase } from '../types/game'
import type { TrackedMode } from '../types/game'
import { todayISO } from './date'

interface ProfileRow {
    is_premium: boolean
    stats: ModeStats
    library_progress: LibraryProgress
    daily_save: DailySave | null
    infinite_save: InfiniteSave | null
    last_active_mode: TrackedMode | null
}

// Long debounce: with saves debounced per-move, every active-play minute
// would otherwise trigger a full-payload profiles UPDATE every 2s. The
// visibilitychange flush below covers tab-switch/close, so the only thing a
// long window risks is losing recent progress to a hard crash.
const PUSH_DEBOUNCE_MS = 20000

let pushTimer: ReturnType<typeof setTimeout> | null = null
// Suppresses the persistence-subscribe push trigger while sync is itself
// applying merged state. Without this, runSync's setState would schedule
// a redundant push immediately after the explicit merge-push.
let applyingMerge = false

function minTimeMs(a: number | null, b: number | null): number | null {
    if (a === null) return b
    if (b === null) return a
    return a < b ? a : b
}

function mergeDaily(local: DailyStats, server: DailyStats): DailyStats {
    const localDate = local.lastCompletedDate
    const serverDate = server.lastCompletedDate
    // Streak fields move together — they only make sense relative to a single
    // lastCompletedDate. Pick whichever side completed more recently.
    const streakSide =
        localDate && serverDate
            ? localDate >= serverDate
                ? local
                : server
            : localDate
                ? local
                : server

    return {
        sessionsPlayed: Math.max(local.sessionsPlayed, server.sessionsPlayed),
        sessionsCompleted: Math.max(local.sessionsCompleted, server.sessionsCompleted),
        bestTimeMs: minTimeMs(local.bestTimeMs, server.bestTimeMs),
        hintsUsed: Math.max(local.hintsUsed, server.hintsUsed),
        livesLost: Math.max(local.livesLost, server.livesLost),
        currentStreak: streakSide.currentStreak,
        longestStreak: Math.max(local.longestStreak, server.longestStreak),
        lastCompletedDate: streakSide.lastCompletedDate,
        lastResult: streakSide.lastResult,
    }
}

function mergeInfinite(local: InfiniteStats, server: InfiniteStats): InfiniteStats {
    return {
        runsPlayed: Math.max(local.runsPlayed, server.runsPlayed),
        deepestSizeEver: Math.max(local.deepestSizeEver, server.deepestSizeEver),
        hintsUsed: Math.max(local.hintsUsed, server.hintsUsed),
        livesLost: Math.max(local.livesLost, server.livesLost),
    }
}

function mergeLibrary(local: LibraryStats, server: LibraryStats): LibraryStats {
    const sizes = new Set([
        ...Object.keys(local.tierCompletions),
        ...Object.keys(server.tierCompletions),
    ])
    const tierCompletions: Record<number, number> = {}
    for (const sizeKey of sizes) {
        const size = Number(sizeKey)
        tierCompletions[size] = Math.max(
            local.tierCompletions[size] ?? 0,
            server.tierCompletions[size] ?? 0
        )
    }
    return {
        tierCompletions,
        hintsUsed: Math.max(local.hintsUsed, server.hintsUsed),
        livesLost: Math.max(local.livesLost, server.livesLost),
    }
}

function mergeStats(local: ModeStats, server: ModeStats): ModeStats {
    return {
        daily: mergeDaily(local.daily, server.daily),
        infinite: mergeInfinite(local.infinite, server.infinite),
        library: mergeLibrary(local.library, server.library),
    }
}

function pickDailySave(local: DailySave | null, server: DailySave | null): DailySave | null {
    if (local && local.date === todayISO() && local.phase !== Phase.ENDED) return local
    return server
}

function pickInfiniteSave(local: InfiniteSave | null, server: InfiniteSave | null): InfiniteSave | null {
    return local ?? server
}

async function pullProfile(userId: string): Promise<ProfileRow | null> {
    const supabase = await getSupabase()
    const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, stats, library_progress, daily_save, infinite_save, last_active_mode')
        .eq('user_id', userId)
        .single()
    if (error) {
        // eslint-disable-next-line no-console
        console.error('[sync] pullProfile failed', error)
        return null
    }
    return data as ProfileRow
}

async function pushProfile(userId: string): Promise<void> {
    const state = usePersistence.getState()
    const payload = {
        stats: state.stats,
        library_progress: state.libraryProgress,
        daily_save: state.dailySave,
        infinite_save: state.infiniteSave,
        last_active_mode: state.lastActiveMode,
    }
    const supabase = await getSupabase()
    const { error } = await supabase.from('profiles').update(payload).eq('user_id', userId)
    if (error) {
        // eslint-disable-next-line no-console
        console.error('[sync] pushProfile failed', error)
        // Re-arm the debounce so a transient network error at flush time
        // doesn't silently drop the tail of a session — the next window
        // retries with whatever state is current by then.
        schedulePush()
    }
}

export async function runSync(userId: string): Promise<void> {
    const server = await pullProfile(userId)
    if (!server) return
    const local = usePersistence.getState()
    const isCrossUser =
        local.lastSyncedUserId !== null && local.lastSyncedUserId !== userId

    applyingMerge = true
    try {
        if (isCrossUser) {
            // Different user previously synced this browser. Replace local
            // wholesale to avoid uploading another player's stats to the new
            // account.
            usePersistence.getState().applyServerState({
                isPremium: server.is_premium,
                stats: server.stats,
                libraryProgress: server.library_progress,
                dailySave: server.daily_save,
                infiniteSave: server.infinite_save,
                lastActiveMode: server.last_active_mode,
                lastSyncedUserId: userId,
            })
        } else {
            usePersistence.getState().applyServerState({
                isPremium: server.is_premium,
                stats: mergeStats(local.stats, server.stats),
                libraryProgress: {
                    unlockedMaxSize: Math.max(
                        local.libraryProgress.unlockedMaxSize,
                        server.library_progress.unlockedMaxSize
                    ),
                },
                dailySave: pickDailySave(local.dailySave, server.daily_save),
                infiniteSave: pickInfiniteSave(local.infiniteSave, server.infinite_save),
                lastActiveMode: local.lastActiveMode ?? server.last_active_mode,
                lastSyncedUserId: userId,
            })
        }
    } finally {
        applyingMerge = false
    }

    // Push merged state up so server reflects local-wins fields too.
    if (pushTimer) {
        clearTimeout(pushTimer)
        pushTimer = null
    }
    await pushProfile(userId)
}

export function schedulePush(): void {
    if (applyingMerge) return
    if (useAuth.getState().status !== 'authenticated') return
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
        pushTimer = null
        const userId = useAuth.getState().user?.id
        if (!userId) return
        void pushProfile(userId)
    }, PUSH_DEBOUNCE_MS)
}

export async function flushPendingPush(): Promise<void> {
    if (pushTimer) {
        clearTimeout(pushTimer)
        pushTimer = null
    }
    const userId = useAuth.getState().user?.id
    if (!userId) return
    await pushProfile(userId)
}

// Explicit wiring, called once from index.tsx — NOT at import time, so
// importing sync.ts for runSync/flushPendingPush (useAuth, payments) doesn't
// silently install push scheduling as a side effect.
//
// Wiring: any local persistence change schedules a debounced push (the
// applyingMerge guard prevents sync's own applyServerState from re-triggering
// it), and hiding the tab flushes the pending push so the long debounce never
// drops the tail of a session. The sign-in / sign-out trigger lives in
// useAuth.ts to avoid a circular import (sync.ts <-> useAuth.ts).
let initialized = false
export function initSync(): void {
    if (initialized) return
    initialized = true

    const unsubscribe = usePersistence.subscribe(() => {
        schedulePush()
    })

    const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden' && pushTimer) {
            void flushPendingPush()
        }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // Dev hot reloads re-evaluate this module: tear down the old listeners
    // (so they don't stack) and re-init the fresh module if we were live.
    if (import.meta.hot) {
        import.meta.hot.dispose((data) => {
            data.wasInitialized = initialized
            unsubscribe()
            document.removeEventListener('visibilitychange', onVisibilityChange)
        })
    }
}

if (import.meta.hot?.data.wasInitialized) initSync()
