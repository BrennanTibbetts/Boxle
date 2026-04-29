import { create } from 'zustand'
import usePersistence from './usePersistence'

interface ArcadeRunState {
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

export const ARCADE_START_SIZE = 4
// Capped at 14 because the synchronous generator runs on the main thread
// (`generator/prefetch.ts` defers via `setTimeout`, which still executes on
// the UI thread). At sizes 16+ the puzzle generator can backtrack long
// enough to lock the tab — and because the same prefetch fires on resume
// from `arcadeSave`, an oversized save can lock out the next page load too.
// Until generation moves to a Web Worker, this cap keeps gen latency under
// a noticeable stutter. Saves with `currentSize > ARCADE_MAX_SIZE` clamp
// down here too: prefetch on resume always asks for `min(currentSize+1, MAX)`.
export const ARCADE_MAX_SIZE = 14

const useArcadeRun = create<ArcadeRunState>((set) => ({
    runId: 0,
    currentSize: ARCADE_START_SIZE,
    puzzlesCompleted: 0,
    runHintsUsed: 0,
    runLivesLost: 0,
    startNewRun: () => {
        // Discard any persisted save — fresh run from scratch.
        usePersistence.getState().clearArcade()
        set((s) => ({
            runId: s.runId + 1,
            currentSize: ARCADE_START_SIZE,
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

export default useArcadeRun
