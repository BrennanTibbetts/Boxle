import { create } from 'zustand'

interface ArcadeRunState {
    runId: number
    currentSize: number
    puzzlesCompleted: number
    capReached: boolean
    startNewRun: () => void
    setCurrentSize: (size: number) => void
    incrementPuzzlesCompleted: () => void
    markCapReached: () => void
}

export const ARCADE_START_SIZE = 4
export const ARCADE_MAX_SIZE = 15

const useArcadeRun = create<ArcadeRunState>((set) => ({
    runId: 0,
    currentSize: ARCADE_START_SIZE,
    puzzlesCompleted: 0,
    capReached: false,
    startNewRun: () => set((s) => ({
        runId: s.runId + 1,
        currentSize: ARCADE_START_SIZE,
        puzzlesCompleted: 0,
        capReached: false,
    })),
    setCurrentSize: (size) => set({ currentSize: size }),
    incrementPuzzlesCompleted: () => set((s) => ({ puzzlesCompleted: s.puzzlesCompleted + 1 })),
    markCapReached: () => set({ capReached: true }),
}))

export default useArcadeRun
