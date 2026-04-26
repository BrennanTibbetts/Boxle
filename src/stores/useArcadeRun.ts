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
export const ARCADE_MAX_SIZE = 18

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
