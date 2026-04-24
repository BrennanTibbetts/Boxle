import { create } from 'zustand'

export const LIBRARY_BATCH_SIZE = 10
export const LIBRARY_MIN_SIZE = 4
export const LIBRARY_MAX_SIZE = 15

interface LibraryRunState {
    activeTierSize: number | null
    puzzlesCompletedInTier: number
    showBatchComplete: boolean
    enterTier: (size: number) => void
    leaveTier: () => void
    incrementCompleted: () => void
    resetCompleted: () => void
    markBatchComplete: () => void
    dismissBatchComplete: () => void
}

const useLibraryRun = create<LibraryRunState>((set) => ({
    activeTierSize: null,
    puzzlesCompletedInTier: 0,
    showBatchComplete: false,
    enterTier: (size) => set({
        activeTierSize: size,
        puzzlesCompletedInTier: 0,
        showBatchComplete: false,
    }),
    leaveTier: () => set({
        activeTierSize: null,
        puzzlesCompletedInTier: 0,
        showBatchComplete: false,
    }),
    incrementCompleted: () => set((s) => ({ puzzlesCompletedInTier: s.puzzlesCompletedInTier + 1 })),
    resetCompleted: () => set({ puzzlesCompletedInTier: 0 }),
    markBatchComplete: () => set({ showBatchComplete: true }),
    dismissBatchComplete: () => set({ showBatchComplete: false, puzzlesCompletedInTier: 0 }),
}))

export default useLibraryRun
