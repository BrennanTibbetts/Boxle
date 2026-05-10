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
// Paid ceiling — the absolute cap on Infinite depth, even with premium.
// Sourced from MAX_PUZZLE_SIZE (the shared min/max knob); the generator's
// own pain point is far higher (size-16+ on the synchronous main-thread
// generator), so today this cap is a pricing/pacing decision rather than
// a generator constraint. Saves with `currentSize > INFINITE_MAX_SIZE`
// clamp down on resume: prefetch always asks for `min(currentSize+1, MAX)`.
export const INFINITE_MAX_SIZE = MAX_PUZZLE_SIZE

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
