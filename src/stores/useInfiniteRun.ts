import { create } from 'zustand'
import usePersistence from './usePersistence'
import { MIN_PUZZLE_SIZE, MAX_PUZZLE_SIZE } from '../config/puzzleSize'

interface InfiniteRunState {
    runId: number
    currentSize: number
    puzzlesCompleted: number
    runHintsUsed: number
    runLivesLost: number
    startNewRun: () => void
    setCurrentSize: (size: number) => void
    incrementPuzzlesCompleted: () => void
    addPuzzleStats: (hints: number, livesLost: number) => void
}

export const INFINITE_START_SIZE = MIN_PUZZLE_SIZE
// Infinite's ladder tops out at 12×12 — the shared MAX_PUZZLE_SIZE ceiling.
// Boards beyond ~12 take long enough to read that they stop feeling like a
// "survival sprint", and a 12×12 already fills the screen. Capped via
// `Math.min` so it can never exceed the shared ceiling even if that's raised.
// Saves with `currentSize > INFINITE_MAX_SIZE` clamp down on resume; prefetch
// always asks for `min(currentSize+1, INFINITE_MAX_SIZE)`.
export const INFINITE_MAX_SIZE = Math.min(12, MAX_PUZZLE_SIZE)

const useInfiniteRun = create<InfiniteRunState>((set) => ({
    runId: 0,
    currentSize: INFINITE_START_SIZE,
    puzzlesCompleted: 0,
    runHintsUsed: 0,
    runLivesLost: 0,
    startNewRun: () => {
        // Discard any persisted save — fresh run from scratch.
        usePersistence.getState().clearInfinite()
        set((s) => ({
            runId: s.runId + 1,
            currentSize: INFINITE_START_SIZE,
            puzzlesCompleted: 0,
            runHintsUsed: 0,
            runLivesLost: 0,
        }))
    },
    setCurrentSize: (size) => set({ currentSize: size }),
    incrementPuzzlesCompleted: () => set((s) => ({ puzzlesCompleted: s.puzzlesCompleted + 1 })),
    addPuzzleStats: (hints, livesLost) => set((s) => ({
        runHintsUsed: s.runHintsUsed + hints,
        runLivesLost: s.runLivesLost + livesLost,
    })),
}))

export default useInfiniteRun
