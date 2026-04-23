import { create } from 'zustand'
import { BoxState } from '../types/game'
import type { HintCellRole, HintResult } from '../utils/hintRules'
import useGame from './useGame'

interface HintState {
    activeHint: HintResult | null
    setHint: (hint: HintResult | null) => void
    clearHint: () => void
    getCellRole: (levelIndex: number, row: number, col: number) => HintCellRole | null
}

const useHint = create<HintState>((set, get) => ({
    activeHint: null,

    setHint: (hint) => set({ activeHint: hint }),

    clearHint: () => set({ activeHint: null }),

    getCellRole: (levelIndex, row, col) => {
        const hint = get().activeHint
        if (!hint || hint.levelIndex !== levelIndex) return null
        if (hint.targetCells.some(c => c.row === row && c.col === col)) return 'target'
        if (hint.sourceCells.some(c => c.row === row && c.col === col)) return 'source'
        if (hint.eliminateCells.some(c => c.row === row && c.col === col)) return 'eliminate'
        return null
    },
}))

useGame.subscribe(
    (state) => state.levels,
    (levels, prevLevels) => {
        const hint = useHint.getState().activeHint
        if (!hint) return
        const levelGrid = levels[hint.levelIndex]
        const prevGrid  = prevLevels[hint.levelIndex]
        if (!levelGrid || !prevGrid) return

        if (hint.targetCells.length > 0) {
            // Target hint: clear when the target cell becomes a star
            for (const { row, col } of hint.targetCells) {
                if (levelGrid[row]?.[col] === BoxState.STAR) {
                    useHint.getState().clearHint()
                    return
                }
            }
        } else if (hint.eliminateCells.length > 0) {
            // Elimination hint: clear once every eliminate cell is resolved (marked or auto-locked by a star placement)
            const allMarked = hint.eliminateCells.every(({ row, col }) => {
                const s = levelGrid[row]?.[col]
                return s === BoxState.MARK || s === BoxState.LOCK
            })
            if (allMarked) {
                useHint.getState().clearHint()
                return
            }
        } else {
            // No specific cells to act on — clear on any new star
            for (let r = 0; r < levelGrid.length; r++) {
                for (let c = 0; c < levelGrid[r].length; c++) {
                    if (levelGrid[r][c] === BoxState.STAR && prevGrid[r]?.[c] !== BoxState.STAR) {
                        useHint.getState().clearHint()
                        return
                    }
                }
            }
        }
    }
)

useGame.subscribe(
    (state) => state.currentLevel,
    () => useHint.getState().clearHint()
)

export default useHint
