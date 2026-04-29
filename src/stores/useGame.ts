import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Phase, BoxState, GameMode } from '../types/game'
import type { PhaseValue, BoxStateValue, LevelGrid, GameModeValue } from '../types/game'
import type { DecodedBoard } from '../types/puzzle'

export { Phase, BoxState, GameMode }
export type { PhaseValue, BoxStateValue, LevelGrid, GameModeValue }

export function makeBlankGrid(size: number): LevelGrid {
    return Array.from({ length: size }, (): BoxStateValue[] =>
        new Array<BoxStateValue>(size).fill(BoxState.BLANK)
    )
}

// Mode-provider helpers: produce the partial GameState patch for starting
// a fresh session and for stacking the next puzzle onto an in-progress run.
// Kept here (not in modes/) so the shape stays in sync with GameState itself.

type InitPatch = Pick<GameState,
    'levelConfigs' | 'levels' | 'levelMistakes' | 'currentLevel' | 'phase' |
    'startTime' | 'endTime' | 'wrongPlacement' | 'lastBoxlePosition' |
    'lives' | 'sessionHints' | 'sessionLivesLost'
>

type AdvancePatch = Omit<InitPatch, 'lives'>

export function initGameState(puzzles: DecodedBoard[]): InitPatch {
    return {
        levelConfigs: puzzles,
        levels: puzzles.map(({ levelMatrix }) => makeBlankGrid(levelMatrix.length)),
        levelMistakes: puzzles.map(() => 0),
        currentLevel: 1,
        phase: Phase.PLAYING,
        startTime: Date.now(),
        endTime: null,
        wrongPlacement: null,
        lastBoxlePosition: null,
        lives: 3,
        sessionHints: 0,
        sessionLivesLost: 0,
    }
}

export function advanceGameState(
    current: Pick<GameState, 'levelConfigs' | 'levels' | 'levelMistakes'>,
    nextPuzzle: DecodedBoard,
): AdvancePatch {
    const size = nextPuzzle.levelMatrix.length
    return {
        levelConfigs: [...current.levelConfigs, nextPuzzle],
        levels: [...current.levels, makeBlankGrid(size)],
        levelMistakes: [...current.levelMistakes, 0],
        currentLevel: current.levelConfigs.length + 1,
        phase: Phase.PLAYING,
        startTime: Date.now(),
        endTime: null,
        wrongPlacement: null,
        lastBoxlePosition: null,
        sessionHints: 0,
        sessionLivesLost: 0,
    }
}

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
    placeBoxle: (levelIndex: number, row: number, col: number) => void
    toggleMark: (levelIndex: number, row: number, col: number) => void
    getBoxState: (levelIndex: number, row: number, col: number) => BoxStateValue
    clearMarks: (levelIndex: number) => void

    // Lives
    lives: number
    incrementLives: () => void
    decrementLives: () => void
    setLives: (lives: number) => void

    // Boxle tracking (for cascade animation)
    lastBoxlePosition: { levelIndex: number, row: number, col: number } | null

    // Wrong placement (drives shake/flash animation before game over)
    wrongPlacement: { levelIndex: number, row: number, col: number } | null
    clearWrongPlacement: () => void

    // Session stats (ephemeral, not persisted)
    sessionHints: number
    sessionLivesLost: number
    levelMistakes: number[]
    incrementSessionHint: () => void

    // Mode
    activeMode: GameModeValue
    setMode: (mode: GameModeValue) => void
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
    restart: () => set((state) => ({
        phase: Phase.PLAYING,
        startTime: Date.now(),
        endTime: null,
        currentLevel: 1,
        lives: 3,
        lastBoxlePosition: null,
        wrongPlacement: null,
        sessionHints: 0,
        sessionLivesLost: 0,
        levelMistakes: state.levelConfigs.map(() => 0),
        levels: state.levelConfigs.map(({ levelMatrix }) => makeBlankGrid(levelMatrix.length)),
    })),
    end: () => set({ phase: Phase.ENDED, endTime: Date.now() }),

    // Levels
    currentLevel: 1,
    levels: [],
    levelConfigs: [],

    populatePuzzles: (configs) => set({
        levelConfigs: configs,
        levels: configs.map(({ levelMatrix }) => makeBlankGrid(levelMatrix.length)),
        currentLevel: 1,
        startTime: Date.now(),
        endTime: null,
        wrongPlacement: null,
        sessionHints: 0,
        sessionLivesLost: 0,
        levelMistakes: configs.map(() => 0),
    }),

    setCurrentLevel: (level) => set({ currentLevel: level }),

    placeBoxle: (levelIndex, row, col) => set((state) => {
        const config = state.levelConfigs[levelIndex]
        const levelState = state.levels[levelIndex]
        if (!config || !levelState) return {}

        const { levelMatrix, answerMatrix } = config
        const isAnswer = answerMatrix[row][col]
        const group = levelMatrix[row][col]

        if (!isAnswer) {
            const newLives = state.lives - 1
            const updatedMistakes = state.levelMistakes.map((count, i) =>
                i === levelIndex ? count + 1 : count
            )
            // Don't set Phase.ENDED here — the Box animation fires first, calls end() on complete
            return {
                lives: Math.max(0, newLives),
                wrongPlacement: { levelIndex, row, col },
                sessionLivesLost: state.sessionLivesLost + 1,
                levelMistakes: updatedMistakes,
            }
        }

        const n = levelMatrix.length
        const updatedLevel: LevelGrid = levelState.map((rowData, r) =>
            rowData.map((boxState, c): BoxStateValue => {
                if (r === row && c === col) return BoxState.BOXLE
                if (levelMatrix[r][c] === group) return BoxState.LOCK
                if (r === row) return BoxState.LOCK
                if (c === col) return BoxState.LOCK
                if (Math.abs(r - row) === 1 && Math.abs(c - col) === 1) return BoxState.LOCK
                return boxState
            })
        )

        const boxleCount = updatedLevel.flat().filter((s) => s === BoxState.BOXLE).length
        const isComplete = boxleCount >= n
        const nextLevel = isComplete
            ? Math.min(state.currentLevel + 1, state.levels.length)
            : state.currentLevel

        const updatedLevels = state.levels.map((level, i) =>
            i === levelIndex ? updatedLevel : level
        )

        const isSessionComplete = isComplete && state.currentLevel >= state.levels.length

        return {
            levels: updatedLevels,
            currentLevel: nextLevel,
            lastBoxlePosition: { levelIndex, row, col },
            ...(isSessionComplete ? { phase: Phase.ENDED, endTime: Date.now() } : {}),
        }
    }),

    toggleMark: (levelIndex, row, col) => set((state) => {
        const levelState = state.levels[levelIndex]
        if (!levelState) return {}

        const current = levelState[row]?.[col]
        if (current !== BoxState.BLANK && current !== BoxState.MARK) return {}

        const newState: BoxStateValue = current === BoxState.BLANK ? BoxState.MARK : BoxState.BLANK
        const updatedLevel = levelState.map((rowData, r) =>
            rowData.map((boxState, c): BoxStateValue => r === row && c === col ? newState : boxState)
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
            rowData.map((boxState): BoxStateValue => boxState === BoxState.MARK ? BoxState.BLANK : boxState)
        )
        return { levels: state.levels.map((level, i) => i === levelIndex ? updatedLevel : level) }
    }),

    // Lives
    lives: 3,
    incrementLives: () => set((state) => ({ lives: state.lives + 1 })),
    decrementLives: () => set((state) => {
        const newLives = state.lives - 1
        if (newLives <= 0) return { lives: 0, endTime: Date.now(), phase: Phase.ENDED }
        return { lives: newLives }
    }),
    setLives: (lives) => set({ lives }),

    // Boxle tracking
    lastBoxlePosition: null,

    // Wrong placement
    wrongPlacement: null,
    clearWrongPlacement: () => set({ wrongPlacement: null }),

    // Session stats
    sessionHints: 0,
    sessionLivesLost: 0,
    levelMistakes: [],
    incrementSessionHint: () => set((state) => ({ sessionHints: state.sessionHints + 1 })),

    // Mode
    activeMode: GameMode.DAILY,
    setMode: (mode) => set({ activeMode: mode }),
})))
