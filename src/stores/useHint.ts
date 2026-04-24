import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import gsap from 'gsap'
import { BoxState } from '../types/game'
import type { HintBoxRole, HintResult } from '../utils/hintRules'
import useGame from './useGame'
import { useResource } from './useResource'
import useBoxSettings from './useBoxSettings'

interface HintState {
    activeHint: HintResult | null
    setHint: (hint: HintResult | null) => void
    clearHint: () => void
    getBoxRole: (levelIndex: number, row: number, col: number) => HintBoxRole | null
}

const useHint = create<HintState>()(subscribeWithSelector((set, get) => ({
    activeHint: null,

    setHint: (hint) => set({ activeHint: hint }),

    clearHint: () => set({ activeHint: null }),

    getBoxRole: (levelIndex, row, col) => {
        const hint = get().activeHint
        if (!hint || hint.levelIndex !== levelIndex) return null
        if (hint.answerBoxes.some(c => c.row === row && c.col === col)) return 'answer'
        if (hint.sourceBoxes.some(c => c.row === row && c.col === col)) return 'source'
        if (hint.eliminateBoxes.some(c => c.row === row && c.col === col)) return 'eliminate'
        return null
    },
})))

useHint.subscribe(
    (state) => state.activeHint !== null,
    (isActive) => {
        const dim = useResource.getState().getDimMaterial()
        const { hintDimOpacity } = useBoxSettings.getState()
        gsap.to(dim, {
            opacity: isActive ? hintDimOpacity : 0,
            duration: 0.3,
            ease: 'power2.out',
        })
    }
)

useGame.subscribe(
    (state) => state.levels,
    (levels, prevLevels) => {
        const hint = useHint.getState().activeHint
        if (!hint) return
        const levelGrid = levels[hint.levelIndex]
        const prevGrid  = prevLevels[hint.levelIndex]
        if (!levelGrid || !prevGrid) return

        if (hint.answerBoxes.length > 0) {
            // Answer hint: clear when the answer box receives a boxle
            for (const { row, col } of hint.answerBoxes) {
                if (levelGrid[row]?.[col] === BoxState.BOXLE) {
                    useHint.getState().clearHint()
                    return
                }
            }
        } else if (hint.eliminateBoxes.length > 0) {
            // Elimination hint: clear once every eliminate box is resolved (marked or auto-locked by a boxle placement)
            const allMarked = hint.eliminateBoxes.every(({ row, col }) => {
                const s = levelGrid[row]?.[col]
                return s === BoxState.MARK || s === BoxState.LOCK
            })
            if (allMarked) {
                useHint.getState().clearHint()
                return
            }
        } else {
            // No specific boxes to act on — clear on any new boxle
            for (let r = 0; r < levelGrid.length; r++) {
                for (let c = 0; c < levelGrid[r].length; c++) {
                    if (levelGrid[r][c] === BoxState.BOXLE && prevGrid[r]?.[c] !== BoxState.BOXLE) {
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
