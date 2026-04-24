import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BoxStateValue, PhaseValue } from '../types/game'

type TrackedMode = 'daily' | 'arcade' | 'library'

function getToday(): string {
    return new Date().toISOString().slice(0, 10)
}

function getYesterday(): string {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return d.toISOString().slice(0, 10)
}

export interface DailySave {
    date: string
    currentLevel: number
    lives: number
    levels: BoxStateValue[][][]
    phase: PhaseValue
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
}

export interface ArcadeStats {
    runsPlayed: number
    runsCompleted: number
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
    arcade: ArcadeStats
    library: LibraryStats
}

export interface LibraryProgress {
    unlockedMaxSize: number
}

interface PersistenceData {
    dailySave: DailySave | null
    stats: ModeStats
    libraryProgress: LibraryProgress
    isPremium: boolean
}

interface PersistenceState extends PersistenceData {
    // Daily save slot
    saveDaily: (data: Omit<DailySave, 'date'>) => void
    loadDaily: () => Omit<DailySave, 'date'> | null

    // Daily lifecycle
    startDailySession: () => void
    completeDailySession: (timeMs: number) => void
    checkStreakExpiry: () => void

    // Arcade lifecycle
    startArcadeRun: () => void
    endArcadeRun: (params: { deepestSize: number; completed: boolean }) => void

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
}

const initialArcade: ArcadeStats = {
    runsPlayed: 0,
    runsCompleted: 0,
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
    unlockedMaxSize: 4,
}

const usePersistence = create<PersistenceState>()(
    persist(
        (set, get) => ({
            dailySave: null,
            stats: {
                daily: initialDaily,
                arcade: initialArcade,
                library: initialLibrary,
            },
            libraryProgress: initialLibraryProgress,
            isPremium: false,

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

            completeDailySession: (timeMs) => {
                const today = getToday()
                set((state) => {
                    const daily = state.stats.daily
                    const { lastCompletedDate, currentStreak, longestStreak, bestTimeMs } = daily

                    let newStreak = currentStreak
                    if (lastCompletedDate === getYesterday()) {
                        newStreak = currentStreak + 1
                    } else if (lastCompletedDate !== today) {
                        newStreak = 1
                    }

                    return {
                        stats: {
                            ...state.stats,
                            daily: {
                                ...daily,
                                sessionsCompleted: daily.sessionsCompleted + 1,
                                bestTimeMs: bestTimeMs === null || timeMs < bestTimeMs ? timeMs : bestTimeMs,
                                currentStreak: newStreak,
                                longestStreak: Math.max(longestStreak, newStreak),
                                lastCompletedDate: today,
                            },
                        },
                    }
                })
            },

            checkStreakExpiry: () => {
                const daily = get().stats.daily
                if (daily.currentStreak === 0 || !daily.lastCompletedDate) return
                const today = getToday()
                const yesterday = getYesterday()
                if (daily.lastCompletedDate !== today && daily.lastCompletedDate !== yesterday) {
                    set((state) => ({
                        stats: {
                            ...state.stats,
                            daily: { ...state.stats.daily, currentStreak: 0 },
                        },
                    }))
                }
            },

            startArcadeRun: () => {
                set((state) => ({
                    stats: {
                        ...state.stats,
                        arcade: {
                            ...state.stats.arcade,
                            runsPlayed: state.stats.arcade.runsPlayed + 1,
                        },
                    },
                }))
            },

            endArcadeRun: ({ deepestSize, completed }) => {
                set((state) => ({
                    stats: {
                        ...state.stats,
                        arcade: {
                            ...state.stats.arcade,
                            runsCompleted: state.stats.arcade.runsCompleted + (completed ? 1 : 0),
                            deepestSizeEver: Math.max(state.stats.arcade.deepestSizeEver, deepestSize),
                        },
                    },
                }))
            },

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
            name: 'boxle-v2',
            partialize: (state) => ({
                dailySave: state.dailySave,
                stats: state.stats,
                libraryProgress: state.libraryProgress,
                isPremium: state.isPremium,
            }),
        }
    )
)

export default usePersistence
