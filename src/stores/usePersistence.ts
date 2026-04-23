import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BoxStateValue, PhaseValue } from '../types/game'

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

interface PersistenceData {
    daily: DailySave | null
    totalSessions: number
    totalCompleted: number
    bestTimeMs: number | null
    totalHints: number
    totalMistakes: number
    currentStreak: number
    longestStreak: number
    lastCompletedDate: string | null
}

interface PersistenceState extends PersistenceData {
    saveDaily: (data: Omit<DailySave, 'date'>) => void
    loadDaily: () => Omit<DailySave, 'date'> | null
    startSession: () => void
    completeSession: (timeMs: number) => void
    recordHint: () => void
    recordMistakes: (count: number) => void
    checkStreakExpiry: () => void
}

const usePersistence = create<PersistenceState>()(
    persist(
        (set, get) => ({
            daily: null,
            totalSessions: 0,
            totalCompleted: 0,
            bestTimeMs: null,
            totalHints: 0,
            totalMistakes: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: null,

            saveDaily: (data) => {
                set({ daily: { date: getToday(), ...data } })
            },

            loadDaily: () => {
                const { daily } = get()
                if (!daily || daily.date !== getToday()) return null
                const { date: _date, ...rest } = daily
                return rest
            },

            startSession: () => {
                set((state) => ({ totalSessions: state.totalSessions + 1 }))
            },

            completeSession: (timeMs) => {
                const today = getToday()
                set((state) => {
                    const { lastCompletedDate, currentStreak, longestStreak } = state

                    let newStreak = currentStreak
                    if (lastCompletedDate === getYesterday()) {
                        newStreak = currentStreak + 1
                    } else if (lastCompletedDate !== today) {
                        newStreak = 1
                    }

                    return {
                        totalCompleted: state.totalCompleted + 1,
                        bestTimeMs: state.bestTimeMs === null || timeMs < state.bestTimeMs
                            ? timeMs
                            : state.bestTimeMs,
                        currentStreak: newStreak,
                        longestStreak: Math.max(longestStreak, newStreak),
                        lastCompletedDate: today,
                    }
                })
            },

            recordHint: () => {
                set((state) => ({ totalHints: state.totalHints + 1 }))
            },

            recordMistakes: (count) => {
                set((state) => ({ totalMistakes: state.totalMistakes + count }))
            },

            checkStreakExpiry: () => {
                const { lastCompletedDate, currentStreak } = get()
                if (currentStreak === 0 || !lastCompletedDate) return
                const today = getToday()
                const yesterday = getYesterday()
                if (lastCompletedDate !== today && lastCompletedDate !== yesterday) {
                    set({ currentStreak: 0 })
                }
            },
        }),
        {
            name: 'boxle-v1',
            partialize: (state) => ({
                daily: state.daily,
                totalSessions: state.totalSessions,
                totalCompleted: state.totalCompleted,
                bestTimeMs: state.bestTimeMs,
                totalHints: state.totalHints,
                totalMistakes: state.totalMistakes,
                currentStreak: state.currentStreak,
                longestStreak: state.longestStreak,
                lastCompletedDate: state.lastCompletedDate,
            }),
        }
    )
)

export default usePersistence
