import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BoxStateValue, PhaseValue, TrackedMode } from '../types/game'
import type { DecodedBoard } from '../types/puzzle'
import { MIN_PUZZLE_SIZE } from '../config/puzzleSize'
import { todayISO as getToday } from '../utils/date'

// Streaks live and die by this check. Computes yesterday from `today` so the
// function is a pure date comparison — testable without freezing the clock.
function isConsecutiveDay(prevCompletedDate: string | null, today: string): boolean {
    if (!prevCompletedDate) return false
    const todayDate = new Date(`${today}T00:00:00Z`)
    todayDate.setUTCDate(todayDate.getUTCDate() - 1)
    return prevCompletedDate === todayDate.toISOString().slice(0, 10)
}

export interface DailySave {
    date: string
    currentLevel: number
    lives: number
    levels: BoxStateValue[][][]
    phase: PhaseValue
    elapsedMs: number
}

export interface InfiniteSave {
    // Run-level state
    currentSize: number
    puzzlesCompleted: number
    runHintsUsed: number
    runLivesLost: number
    // Game-level state (per-puzzle progress)
    levelConfigs: DecodedBoard[]
    levels: BoxStateValue[][][]
    levelMistakes: number[]
    currentLevel: number
    lives: number
    sessionHints: number
    sessionLivesLost: number
    elapsedMs: number
}

export interface DailyResult {
    date: string
    isComplete: boolean
    levelsCompleted: number
    levelCount: number
    elapsedMs: number | null
    hintsUsed: number
    livesLost: number
    levelMistakes: number[]
}

export interface DailyStats {
    sessionsPlayed: number
    sessionsCompleted: number
    bestTimeMs: number | null
    hintsUsed: number
    livesLost: number
    currentStreak: number
    longestStreak: number
    lastCompletedDate: string | null
    lastResult: DailyResult | null
}

export interface InfiniteStats {
    runsPlayed: number
    deepestSizeEver: number
    hintsUsed: number
    livesLost: number
}

export interface LibraryStats {
    tierCompletions: Record<number, number>
    hintsUsed: number
    livesLost: number
}

export interface ModeStats {
    daily: DailyStats
    infinite: InfiniteStats
    library: LibraryStats
}

export interface LibraryProgress {
    unlockedMaxSize: number
}

interface PersistenceData {
    dailySave: DailySave | null
    infiniteSave: InfiniteSave | null
    // The last non-menu mode the player was in. Used by boot routing so a
    // refresh drops them back where they were instead of at the menu.
    lastActiveMode: TrackedMode | null
    stats: ModeStats
    libraryProgress: LibraryProgress
    // Mirrors the future API payload shape but is never authoritative on the
    // web no-account path — always false here. Real unlocks come from the
    // auth layer (JWT claim / verified-purchase API response). A locally
    // flipped flag must NEVER unlock content; assume DevTools exists.
    isPremium: boolean
    // Tracks which auth user this localStorage was last synced for. Lets sync
    // detect cross-user reuse (shared computer): if the new sign-in's user id
    // differs, local is replaced with server instead of merged.
    lastSyncedUserId: string | null
}

interface PersistenceState extends PersistenceData {
    // The ONLY sanctioned writer for server-derived state — notably isPremium
    // (see the trust note above) and lastSyncedUserId. sync.ts calls this
    // with merged/replaced profile state; nothing else should set these
    // fields, so any other write path is a red flag in review.
    applyServerState: (server: {
        isPremium: boolean
        stats: ModeStats
        libraryProgress: LibraryProgress
        dailySave: DailySave | null
        infiniteSave: InfiniteSave | null
        lastActiveMode: TrackedMode | null
        lastSyncedUserId: string
    }) => void

    // Daily save slot
    saveDaily: (data: Omit<DailySave, 'date'>) => void
    loadDaily: () => Omit<DailySave, 'date'> | null

    // Daily lifecycle
    startDailySession: () => void
    // Batches the session-end trio (lives-lost counter, completion stats +
    // streak, lastResult snapshot) into one set() — each set() on this store
    // re-serializes the whole persist blob to localStorage, so three separate
    // actions meant three full writes in one tick at the moment the
    // EndScreen mounts. `completedTimeMs` is null for a failed session.
    recordDailySessionEnd: (params: { livesLost: number; completedTimeMs: number | null; result: DailyResult }) => void
    checkStreakExpiry: () => void

    // Infinite lifecycle
    startInfiniteRun: () => void
    endInfiniteRun: (params: { deepestSize: number }) => void
    saveInfinite: (save: InfiniteSave) => void
    clearInfinite: () => void

    // Tracks the last non-menu mode the player was in.
    setLastActiveMode: (mode: TrackedMode) => void

    // Library lifecycle
    recordLibraryPuzzleCompletion: (size: number) => void
    unlockLibrarySize: (size: number) => void

    // Cross-mode counters
    recordHint: (mode: TrackedMode) => void
    recordLivesLost: (mode: TrackedMode, count: number) => void
}

const initialDaily: DailyStats = {
    sessionsPlayed: 0,
    sessionsCompleted: 0,
    bestTimeMs: null,
    hintsUsed: 0,
    livesLost: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    lastResult: null,
}

const initialInfinite: InfiniteStats = {
    runsPlayed: 0,
    deepestSizeEver: 0,
    hintsUsed: 0,
    livesLost: 0,
}

const initialLibrary: LibraryStats = {
    tierCompletions: {},
    hintsUsed: 0,
    livesLost: 0,
}

const initialLibraryProgress: LibraryProgress = {
    unlockedMaxSize: MIN_PUZZLE_SIZE,
}

const usePersistence = create<PersistenceState>()(
    persist(
        (set, get) => ({
            dailySave: null,
            infiniteSave: null,
            lastActiveMode: null,
            stats: {
                daily: initialDaily,
                infinite: initialInfinite,
                library: initialLibrary,
            },
            libraryProgress: initialLibraryProgress,
            isPremium: false,
            lastSyncedUserId: null,

            applyServerState: (server) => set(server),

            saveDaily: (data) => {
                set({ dailySave: { date: getToday(), ...data } })
            },

            loadDaily: () => {
                const { dailySave } = get()
                if (!dailySave || dailySave.date !== getToday()) return null
                const { date: _date, ...rest } = dailySave
                return rest
            },

            startDailySession: () => {
                set((state) => ({
                    stats: {
                        ...state.stats,
                        daily: {
                            ...state.stats.daily,
                            sessionsPlayed: state.stats.daily.sessionsPlayed + 1,
                        },
                    },
                }))
            },

            recordDailySessionEnd: ({ livesLost, completedTimeMs, result }) => {
                const today = getToday()
                set((state) => {
                    let daily = state.stats.daily

                    if (livesLost > 0) {
                        daily = { ...daily, livesLost: daily.livesLost + livesLost }
                    }

                    if (completedTimeMs !== null) {
                        const { lastCompletedDate, currentStreak, longestStreak, bestTimeMs } = daily

                        let newStreak = currentStreak
                        if (isConsecutiveDay(lastCompletedDate, today)) {
                            newStreak = currentStreak + 1
                        } else if (lastCompletedDate !== today) {
                            newStreak = 1
                        }

                        daily = {
                            ...daily,
                            sessionsCompleted: daily.sessionsCompleted + 1,
                            bestTimeMs: bestTimeMs === null || completedTimeMs < bestTimeMs ? completedTimeMs : bestTimeMs,
                            currentStreak: newStreak,
                            longestStreak: Math.max(longestStreak, newStreak),
                            lastCompletedDate: today,
                        }
                    }

                    return {
                        stats: {
                            ...state.stats,
                            daily: { ...daily, lastResult: result },
                        },
                    }
                })
            },

            checkStreakExpiry: () => {
                const daily = get().stats.daily
                if (daily.currentStreak === 0 || !daily.lastCompletedDate) return
                const today = getToday()
                if (daily.lastCompletedDate !== today && !isConsecutiveDay(daily.lastCompletedDate, today)) {
                    set((state) => ({
                        stats: {
                            ...state.stats,
                            daily: { ...state.stats.daily, currentStreak: 0 },
                        },
                    }))
                }
            },

            startInfiniteRun: () => {
                set((state) => ({
                    stats: {
                        ...state.stats,
                        infinite: {
                            ...state.stats.infinite,
                            runsPlayed: state.stats.infinite.runsPlayed + 1,
                        },
                    },
                }))
            },

            endInfiniteRun: ({ deepestSize }) => {
                set((state) => ({
                    stats: {
                        ...state.stats,
                        infinite: {
                            ...state.stats.infinite,
                            deepestSizeEver: Math.max(state.stats.infinite.deepestSizeEver, deepestSize),
                        },
                    },
                    infiniteSave: null,
                }))
            },

            saveInfinite: (save) => set({ infiniteSave: save }),

            clearInfinite: () => set({ infiniteSave: null }),

            setLastActiveMode: (mode) => set({ lastActiveMode: mode }),

            recordLibraryPuzzleCompletion: (size) => {
                set((state) => {
                    const tierCompletions = state.stats.library.tierCompletions
                    return {
                        stats: {
                            ...state.stats,
                            library: {
                                ...state.stats.library,
                                tierCompletions: {
                                    ...tierCompletions,
                                    [size]: (tierCompletions[size] ?? 0) + 1,
                                },
                            },
                        },
                    }
                })
            },

            unlockLibrarySize: (size) => {
                set((state) => ({
                    libraryProgress: {
                        ...state.libraryProgress,
                        unlockedMaxSize: Math.max(state.libraryProgress.unlockedMaxSize, size),
                    },
                }))
            },

            recordHint: (mode) => {
                set((state) => {
                    const modeStats = state.stats[mode]
                    return {
                        stats: {
                            ...state.stats,
                            [mode]: { ...modeStats, hintsUsed: modeStats.hintsUsed + 1 },
                        },
                    }
                })
            },

            recordLivesLost: (mode, count) => {
                if (count <= 0) return
                set((state) => {
                    const modeStats = state.stats[mode]
                    return {
                        stats: {
                            ...state.stats,
                            [mode]: { ...modeStats, livesLost: modeStats.livesLost + count },
                        },
                    }
                })
            },
        }),
        {
            name: 'boxle-v3',
            partialize: (state) => ({
                dailySave: state.dailySave,
                infiniteSave: state.infiniteSave,
                lastActiveMode: state.lastActiveMode,
                stats: state.stats,
                libraryProgress: state.libraryProgress,
                isPremium: state.isPremium,
                lastSyncedUserId: state.lastSyncedUserId,
            }),
        }
    )
)

// Normalize the persisted Library floor on load. If MIN_PUZZLE_SIZE is
// raised after a player has already played, their stored unlockedMaxSize
// can be below the new floor, which would lock them out of the smallest
// tier. The lower bound is the floor itself — players never need to "earn"
// their way up to it.
{
    const lp = usePersistence.getState().libraryProgress
    if (lp.unlockedMaxSize < MIN_PUZZLE_SIZE) {
        usePersistence.setState({
            libraryProgress: { ...lp, unlockedMaxSize: MIN_PUZZLE_SIZE },
        })
    }
}

export default usePersistence
