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

// Deep copy of a single level's grid for the undo stack — rows hold primitive
// box states, so a row-wise spread is a full clone.
function cloneGrid(grid: LevelGrid): LevelGrid {
    return grid.map((row) => [...row])
}

function gridsEqual(a: LevelGrid, b: LevelGrid): boolean {
    if (a.length !== b.length) return false
    for (let r = 0; r < a.length; r++) {
        if (a[r].length !== b[r].length) return false
        for (let c = 0; c < a[r].length; c++) if (a[r][c] !== b[r][c]) return false
    }
    return true
}

type UndoEntry = { levelIndex: number, grid: LevelGrid }

// Mode-provider helpers: produce the partial GameState patch for starting
// a fresh session and for stacking the next puzzle onto an in-progress run.
// Kept here (not in modes/) so the shape stays in sync with GameState itself.

type InitPatch = Pick<GameState,
    'levelConfigs' | 'levels' | 'levelMistakes' | 'currentLevel' | 'phase' |
    'startTime' | 'endTime' | 'wrongPlacement' | 'lastBoxlePosition' |
    'lives' | 'sessionHints' | 'sessionLivesLost' | 'undoStack' | 'isReverting'
>

// advance keeps `startTime` from the prior puzzle so the round's clock keeps
// running across level transitions (Library batches, Infinite runs). A fresh
// startTime is only minted by initGameState when a new round begins.
type AdvancePatch = Omit<InitPatch, 'lives' | 'startTime'>

export function initGameState(puzzles: DecodedBoard[]): InitPatch {
    return {
        levelConfigs: puzzles,
        levels: puzzles.map(({ levelMatrix }) => makeBlankGrid(levelMatrix.length)),
        levelMistakes: puzzles.map(() => 0),
        currentLevel: 1,
        // Fresh sessions open on the board-intro (hero framing + Start). The
        // clock doesn't run until start() flips to PLAYING. advanceGameState
        // (next puzzle in a run/batch) goes straight to PLAYING — the intro is
        // once per session entry, not per puzzle.
        phase: Phase.READY,
        startTime: null,
        endTime: null,
        wrongPlacement: null,
        lastBoxlePosition: null,
        lives: 3,
        sessionHints: 0,
        sessionLivesLost: 0,
        undoStack: [],
        isReverting: false,
    }
}

// End-of-session outcome, shared by the Daily stats recorder
// (DailyModeProvider) and the EndScreen UI so the completion rule can't
// drift between what's recorded and what's displayed.
export function deriveSessionOutcome(args: {
    lives: number
    startTime: number | null
    endTime: number | null
    currentLevel: number
    levelCount: number
}) {
    const isComplete = args.lives > 0
    const elapsedMs = args.startTime && args.endTime ? args.endTime - args.startTime : null
    const levelsCompleted = isComplete ? args.levelCount : args.currentLevel - 1
    return { isComplete, elapsedMs, levelCount: args.levelCount, levelsCompleted }
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
        endTime: null,
        wrongPlacement: null,
        lastBoxlePosition: null,
        sessionHints: 0,
        sessionLivesLost: 0,
        undoStack: [],
        isReverting: false,
    }
}

interface GameState {

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
    clearMarks: (levelIndex: number) => void

    // Undo — snapshot stack of grid edits (marks, correct placements,
    // clear-marks) within the current level. Resets on level change. Wrong
    // placements never push, so lives lost are not reversible.
    //
    // `isReverting` tells Box to reverse-animate a LOCK/BOXLE→BLANK transition
    // (undo) rather than snap it (restart). Undo is the only producer of those
    // transitions besides hard resets, and every hard-reset path clears the
    // flag alongside `undoStack` — so it's deterministic with no timer: it
    // stays true after an undo (harmlessly; nothing else reads it) until the
    // next reset/new-puzzle/level-change sets it false.
    undoStack: UndoEntry[]
    isReverting: boolean
    undo: () => void

    // Lives. Decrements happen inline in placeBoxle, which defers Phase.ENDED
    // to the wrong-shake animation's end() call — don't add a setter that
    // flips ENDED immediately.
    lives: number

    // Boxle tracking (for cascade animation)
    lastBoxlePosition: { levelIndex: number, row: number, col: number } | null

    // Wrong placement (drives shake/flash animation before game over)
    wrongPlacement: { levelIndex: number, row: number, col: number } | null
    clearWrongPlacement: () => void

    // Session stats. Reset by advanceGameState on every puzzle advance, so in
    // Infinite/Library these are per-puzzle counters (rolled up into the run/
    // batch stores); only in Daily (no advances) do they span the session.
    // Persisted by Infinite's snapshot so a resumed run keeps its counters.
    sessionHints: number
    sessionLivesLost: number
    levelMistakes: number[]
    incrementSessionHint: () => void

    // Mode
    activeMode: GameModeValue
    previousMode: GameModeValue
    setMode: (mode: GameModeValue) => void
    toggleMenu: () => void
}

export default create<GameState>()(subscribeWithSelector((set) => ({
    // Phase. The PLAYING default is only alive for the frames before a mode
    // provider bootstraps (every real entry path sets READY via initGameState/
    // populatePuzzles); with no boards loaded nothing phase-gated can render.
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
        undoStack: [],
        isReverting: false,
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
        // Daily opens on the board-intro too; a saved in-flight daily overrides
        // this back to its stored phase in DailyModeProvider's restore effect,
        // so resumes skip the intro.
        phase: Phase.READY,
        startTime: null,
        endTime: null,
        wrongPlacement: null,
        sessionHints: 0,
        sessionLivesLost: 0,
        levelMistakes: configs.map(() => 0),
        undoStack: [],
        isReverting: false,
    }),

    setCurrentLevel: (level) => set({ currentLevel: level, undoStack: [], isReverting: false }),

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
        const advancing = nextLevel !== state.currentLevel

        // The undo target for a placement returns the placed box to BLANK —
        // consuming the transient mark a double-click creates (onClick marks,
        // onDoubleClick places) — while preserving every other box's marks.
        const preGrid = cloneGrid(levelState)
        preGrid[row][col] = BoxState.BLANK
        // If the immediately-preceding action was marking this same box (the
        // double-click case), its snapshot already equals preGrid — reuse it so
        // the whole gesture is a single undo step instead of two.
        const top = state.undoStack[state.undoStack.length - 1]
        const collapse = !!top && top.levelIndex === levelIndex && gridsEqual(top.grid, preGrid)

        return {
            levels: updatedLevels,
            currentLevel: nextLevel,
            lastBoxlePosition: { levelIndex, row, col },
            undoStack: advancing
                ? []
                : collapse
                    ? state.undoStack
                    : [...state.undoStack, { levelIndex, grid: preGrid }],
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
        return {
            levels: updatedLevels,
            undoStack: [...state.undoStack, { levelIndex, grid: cloneGrid(levelState) }],
        }
    }),

    clearMarks: (levelIndex) => set((state) => {
        const levelState = state.levels[levelIndex]
        if (!levelState) return {}
        const hasMarks = levelState.some((rowData) => rowData.some((s) => s === BoxState.MARK))
        if (!hasMarks) return {}
        const updatedLevel = levelState.map((rowData) =>
            rowData.map((boxState): BoxStateValue => boxState === BoxState.MARK ? BoxState.BLANK : boxState)
        )
        return {
            levels: state.levels.map((level, i) => i === levelIndex ? updatedLevel : level),
            undoStack: [...state.undoStack, { levelIndex, grid: cloneGrid(levelState) }],
        }
    }),

    // Undo
    undoStack: [],
    isReverting: false,
    undo: () => set((state) => {
        const last = state.undoStack[state.undoStack.length - 1]
        if (!last) return {}
        return {
            levels: state.levels.map((level, i) => i === last.levelIndex ? last.grid : level),
            undoStack: state.undoStack.slice(0, -1),
            isReverting: true,
        }
    }),

    // Lives
    lives: 3,

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
    previousMode: GameMode.DAILY,
    setMode: (mode) => set((state) => {
        // Snapshot the mode we're leaving so the Home toggle can return to it.
        if (mode === GameMode.MENU && state.activeMode !== GameMode.MENU) {
            return { activeMode: mode, previousMode: state.activeMode }
        }
        return { activeMode: mode }
    }),
    toggleMenu: () => set((state) => {
        if (state.activeMode === GameMode.MENU) {
            return { activeMode: state.previousMode }
        }
        return { activeMode: GameMode.MENU, previousMode: state.activeMode }
    }),
})))
