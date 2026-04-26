import { create } from 'zustand'

export const LIBRARY_BATCH_SIZE = 10
export const LIBRARY_MIN_SIZE = 4
export const LIBRARY_MAX_SIZE = 18

interface LibraryRunState {
    activeTierSize: number | null
    puzzlesCompletedInTier: number
    showBatchComplete: boolean
    showGameOver: boolean
    batchHintsUsed: number
    batchLivesLost: number
    // A bump counter that the provider effects depend on; increment to trigger
    // a fresh batch start (used when restarting after game over).
    batchId: number
    enterTier: (size: number) => void
    leaveTier: () => void
    incrementCompleted: () => void
    resetCompleted: () => void
    markBatchComplete: () => void
    dismissBatchComplete: () => void
    markGameOver: () => void
    restartBatch: () => void
    addPuzzleStats: (hints: number, livesLost: number) => void
}

const useLibraryRun = create<LibraryRunState>((set) => ({
    activeTierSize: null,
    puzzlesCompletedInTier: 0,
    showBatchComplete: false,
    showGameOver: false,
    batchHintsUsed: 0,
    batchLivesLost: 0,
    batchId: 0,
    enterTier: (size) => set((s) => ({
        activeTierSize: size,
        puzzlesCompletedInTier: 0,
        showBatchComplete: false,
        showGameOver: false,
        batchHintsUsed: 0,
        batchLivesLost: 0,
        batchId: s.batchId + 1,
    })),
    leaveTier: () => set({
        activeTierSize: null,
        puzzlesCompletedInTier: 0,
        showBatchComplete: false,
        showGameOver: false,
        batchHintsUsed: 0,
        batchLivesLost: 0,
    }),
    incrementCompleted: () => set((s) => ({ puzzlesCompletedInTier: s.puzzlesCompletedInTier + 1 })),
    resetCompleted: () => set({ puzzlesCompletedInTier: 0 }),
    markBatchComplete: () => set({ showBatchComplete: true }),
    dismissBatchComplete: () => set((s) => ({
        showBatchComplete: false,
        puzzlesCompletedInTier: 0,
        batchHintsUsed: 0,
        batchLivesLost: 0,
        batchId: s.batchId + 1,
    })),
    markGameOver: () => set({ showGameOver: true }),
    restartBatch: () => set((s) => ({
        showGameOver: false,
        puzzlesCompletedInTier: 0,
        batchHintsUsed: 0,
        batchLivesLost: 0,
        batchId: s.batchId + 1,
    })),
    addPuzzleStats: (hints, livesLost) => set((s) => ({
        batchHintsUsed: s.batchHintsUsed + hints,
        batchLivesLost: s.batchLivesLost + livesLost,
    })),
}))

export default useLibraryRun
