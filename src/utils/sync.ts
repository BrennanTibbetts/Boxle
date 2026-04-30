import { supabase } from './supabase'
import useAuth from '../stores/useAuth'
import usePersistence, {
    type ArcadeSave,
    type ArcadeStats,
    type DailySave,
    type DailyStats,
    type LibraryProgress,
    type LibraryStats,
    type ModeStats,
} from '../stores/usePersistence'
import { Phase } from '../types/game'

type TrackedMode = 'daily' | 'arcade' | 'library'

interface ProfileRow {
    is_premium: boolean
    stats: ModeStats
    library_progress: LibraryProgress
    daily_save: DailySave | null
    arcade_save: ArcadeSave | null
    last_active_mode: TrackedMode | null
}

const PUSH_DEBOUNCE_MS = 2000

let pushTimer: ReturnType<typeof setTimeout> | null = null
// Suppresses the persistence-subscribe push trigger while sync is itself
// applying merged state. Without this, runSync's setState would schedule
// a redundant push immediately after the explicit merge-push.
let applyingMerge = false

function todayISO(): string {
    return new Date().toISOString().slice(0, 10)
}

function maxNum(a: number, b: number): number {
    return a > b ? a : b
}

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
        sessionsPlayed: maxNum(local.sessionsPlayed, server.sessionsPlayed),
        sessionsCompleted: maxNum(local.sessionsCompleted, server.sessionsCompleted),
        bestTimeMs: minTimeMs(local.bestTimeMs, server.bestTimeMs),
        hintsUsed: maxNum(local.hintsUsed, server.hintsUsed),
        livesLost: maxNum(local.livesLost, server.livesLost),
        currentStreak: streakSide.currentStreak,
        longestStreak: maxNum(local.longestStreak, server.longestStreak),
        lastCompletedDate: streakSide.lastCompletedDate,
        lastResult: streakSide.lastResult,
    }
}

function mergeArcade(local: ArcadeStats, server: ArcadeStats): ArcadeStats {
    return {
        runsPlayed: maxNum(local.runsPlayed, server.runsPlayed),
        deepestSizeEver: maxNum(local.deepestSizeEver, server.deepestSizeEver),
        hintsUsed: maxNum(local.hintsUsed, server.hintsUsed),
        livesLost: maxNum(local.livesLost, server.livesLost),
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
        tierCompletions[size] = maxNum(
            local.tierCompletions[size] ?? 0,
            server.tierCompletions[size] ?? 0
        )
    }
    return {
        tierCompletions,
        hintsUsed: maxNum(local.hintsUsed, server.hintsUsed),
        livesLost: maxNum(local.livesLost, server.livesLost),
    }
}

function mergeStats(local: ModeStats, server: ModeStats): ModeStats {
    return {
        daily: mergeDaily(local.daily, server.daily),
        arcade: mergeArcade(local.arcade, server.arcade),
        library: mergeLibrary(local.library, server.library),
    }
}

function pickDailySave(local: DailySave | null, server: DailySave | null): DailySave | null {
    if (local && local.date === todayISO() && local.phase !== Phase.ENDED) return local
    return server
}

function pickArcadeSave(local: ArcadeSave | null, server: ArcadeSave | null): ArcadeSave | null {
    return local ?? server
}

async function pullProfile(userId: string): Promise<ProfileRow | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('is_premium, stats, library_progress, daily_save, arcade_save, last_active_mode')
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
        arcade_save: state.arcadeSave,
        last_active_mode: state.lastActiveMode,
    }
    const { error } = await supabase.from('profiles').update(payload).eq('user_id', userId)
    if (error) {
        // eslint-disable-next-line no-console
        console.error('[sync] pushProfile failed', error)
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
            usePersistence.setState({
                isPremium: server.is_premium,
                stats: server.stats,
                libraryProgress: server.library_progress,
                dailySave: server.daily_save,
                arcadeSave: server.arcade_save,
                lastActiveMode: server.last_active_mode,
                lastSyncedUserId: userId,
            })
        } else {
            usePersistence.setState({
                isPremium: server.is_premium,
                stats: mergeStats(local.stats, server.stats),
                libraryProgress: {
                    unlockedMaxSize: maxNum(
                        local.libraryProgress.unlockedMaxSize,
                        server.library_progress.unlockedMaxSize
                    ),
                },
                dailySave: pickDailySave(local.dailySave, server.daily_save),
                arcadeSave: pickArcadeSave(local.arcadeSave, server.arcade_save),
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

// Module-level: any local state change schedules a debounced push. The
// applyingMerge guard prevents sync's own setState from re-triggering this.
// The sign-in / sign-out trigger lives in useAuth.ts to avoid a circular
// import (sync.ts <-> useAuth.ts).
usePersistence.subscribe(() => {
    schedulePush()
})
