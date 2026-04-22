import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Phase, BoxState } from '../types/game'
import type { PhaseValue, BoxStateValue, LevelGrid } from '../types/game'
import type { DecodedBoard } from '../types/puzzle'

export { Phase, BoxState }
export type { PhaseValue, BoxStateValue, LevelGrid }

interface GameState {
    // Camera
    cameraPosition: [number, number, number]
    cameraRotationZ: number
    setCameraPosition: (position: [number, number, number]) => void
    rotateCamera: (times: number) => void

    // Phase
    phase: PhaseValue
    startTime: number | null
    endTime: number | null
    start: () => void
    restart: () => void
    end: () => void

    // Levels
    currentLevel: number
    levels: LevelGrid[]
    levelConfigs: DecodedBoard[]
    populatePuzzles: (configs: DecodedBoard[]) => void
    setCurrentLevel: (level: number) => void
    placeStar: (levelIndex: number, row: number, col: number) => void
    toggleMark: (levelIndex: number, row: number, col: number) => void
    getBoxState: (levelIndex: number, row: number, col: number) => BoxStateValue
    clearMarks: (levelIndex: number) => void

    // Lives
    lives: number
    incrementLives: () => void
    decrementLives: () => void
    setLives: (lives: number) => void

    // Star tracking (for cascade animation)
    lastStarPosition: { levelIndex: number, row: number, col: number } | null
}

export default create<GameState>()(subscribeWithSelector((set, get) => ({
    // Camera
    cameraPosition: [0, 0, 0],
    cameraRotationZ: 0,
    setCameraPosition: (position) => set({ cameraPosition: position }),
    rotateCamera: (times) => set((state) => ({
        cameraRotationZ: state.cameraRotationZ - (Math.PI / 2) * times
    })),

    // Phase
    phase: Phase.PLAYING,
    startTime: null,
    endTime: null,
    start: () => set({ phase: Phase.PLAYING, startTime: Date.now() }),
    restart: () => set({ phase: Phase.READY, currentLevel: 1, lives: 3, lastStarPosition: null }),
    end: () => set({ phase: Phase.ENDED, endTime: Date.now() }),

    // Levels
    currentLevel: 1,
    levels: [],
    levelConfigs: [],

    populatePuzzles: (configs) => set(() => ({
        levelConfigs: configs,
        levels: configs.map(({ levelMatrix }) =>
            Array.from({ length: levelMatrix.length }, () =>
                Array.from<BoxStateValue>({ length: levelMatrix.length }, () => BoxState.BLANK)
            )
        ),
        currentLevel: 1,
    })),

    setCurrentLevel: (level) => set({ currentLevel: level }),

    placeStar: (levelIndex, row, col) => set((state) => {
        const config = state.levelConfigs[levelIndex]
        const levelState = state.levels[levelIndex]
        if (!config || !levelState) return {}

        const { levelMatrix, answerMatrix } = config
        const isAnswer = answerMatrix[row][col]
        const group = levelMatrix[row][col]

        if (!isAnswer) {
            const newLives = state.lives - 1
            if (newLives <= 0) return { lives: 3, phase: Phase.ENDED }
            return { lives: newLives }
        }

        const n = levelMatrix.length
        const updatedLevel: LevelGrid = levelState.map((rowData, r) =>
            rowData.map((cellState, c): BoxStateValue => {
                if (r === row && c === col) return BoxState.STAR
                if (levelMatrix[r][c] === group) return BoxState.LOCK
                if (r === row) return BoxState.LOCK
                if (c === col) return BoxState.LOCK
                if (Math.abs(r - row) === 1 && Math.abs(c - col) === 1) return BoxState.LOCK
                return cellState
            })
        )

        const starCount = updatedLevel.flat().filter((s) => s === BoxState.STAR).length
        const isComplete = starCount >= n
        const nextLevel = isComplete
            ? Math.min(state.currentLevel + 1, state.levels.length)
            : state.currentLevel

        const updatedLevels = state.levels.map((level, i) =>
            i === levelIndex ? updatedLevel : level
        )

        return { levels: updatedLevels, currentLevel: nextLevel, lastStarPosition: { levelIndex, row, col } }
    }),

    toggleMark: (levelIndex, row, col) => set((state) => {
        const levelState = state.levels[levelIndex]
        if (!levelState) return {}

        const current = levelState[row]?.[col]
        if (current !== BoxState.BLANK && current !== BoxState.MARK) return {}

        const newState: BoxStateValue = current === BoxState.BLANK ? BoxState.MARK : BoxState.BLANK
        const updatedLevel = levelState.map((rowData, r) =>
            rowData.map((cellState, c): BoxStateValue => r === row && c === col ? newState : cellState)
        )
        const updatedLevels = state.levels.map((level, i) =>
            i === levelIndex ? updatedLevel : level
        )
        return { levels: updatedLevels }
    }),

    getBoxState: (levelIndex, row, col) => {
        const state = get()
        return state.levels[levelIndex]?.[row]?.[col] ?? BoxState.BLANK
    },

    clearMarks: (levelIndex) => set((state) => {
        const levelState = state.levels[levelIndex]
        if (!levelState) return {}
        const updatedLevel = levelState.map((rowData) =>
            rowData.map((cellState): BoxStateValue => cellState === BoxState.MARK ? BoxState.BLANK : cellState)
        )
        return { levels: state.levels.map((level, i) => i === levelIndex ? updatedLevel : level) }
    }),

    // Lives
    lives: 3,
    incrementLives: () => set((state) => ({ lives: state.lives + 1 })),
    decrementLives: () => set((state) => {
        const newLives = state.lives - 1
        if (newLives <= 0) return { lives: 3, phase: Phase.ENDED }
        return { lives: newLives }
    }),
    setLives: (lives) => set({ lives }),

    // Star tracking
    lastStarPosition: null,
})))
