import { useEffect } from 'react'
import useGame, { Phase, BoxState, GameMode } from '../stores/useGame'
import type { BoxStateValue, LevelGrid } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useArcadeRun, { ARCADE_START_SIZE, ARCADE_MAX_SIZE } from '../stores/useArcadeRun'
import { generateBoard } from '../generator/generate'
import { decodeBoard } from '../utils/puzzle'
import { canPlayAt } from '../utils/gates'

function makeBlankGrid(size: number): LevelGrid {
    return Array.from({ length: size }, () =>
        new Array<BoxStateValue>(size).fill(BoxState.BLANK)
    )
}

function loadPuzzleForSize(size: number): boolean {
    const raw = generateBoard(size)
    if (!raw) return false
    const decoded = decodeBoard(raw)
    useGame.setState({
        levelConfigs: [decoded],
        levels: [makeBlankGrid(size)],
        currentLevel: 1,
        phase: Phase.PLAYING,
        startTime: Date.now(),
        endTime: null,
        wrongPlacement: null,
        lastBoxlePosition: null,
        sessionHints: 0,
        sessionLivesLost: 0,
        levelMistakes: [0],
    })
    return true
}

export function ArcadeModeProvider() {
    const runId = useArcadeRun((s) => s.runId)

    useEffect(() => {
        const arcade = useArcadeRun.getState()
        const persistence = usePersistence.getState()

        persistence.startArcadeRun()
        useGame.setState({ lives: 3 })
        loadPuzzleForSize(ARCADE_START_SIZE)

        const unsub = useGame.subscribe(
            (state) => state.phase,
            (phase, prevPhase) => {
                if (phase !== Phase.ENDED || prevPhase === Phase.ENDED) return

                const game = useGame.getState()
                const { currentSize } = useArcadeRun.getState()

                // Record mistakes that happened during this puzzle
                if (game.sessionLivesLost > 0) {
                    persistence.recordLivesLost('arcade', game.sessionLivesLost)
                }

                if (game.lives === 0) {
                    // Game over — end run, let EndScreen render
                    persistence.endArcadeRun({ deepestSize: currentSize, completed: false })
                    return
                }

                // Puzzle completed. Advance or hit the cap.
                useArcadeRun.getState().incrementPuzzlesCompleted()

                if (currentSize >= ARCADE_MAX_SIZE) {
                    persistence.endArcadeRun({ deepestSize: currentSize, completed: true })
                    useArcadeRun.getState().markCapReached()
                    return
                }

                const nextSize = currentSize + 1

                if (!canPlayAt(nextSize, GameMode.ARCADE)) {
                    // Phase 5 will swap this for an upsell-screen interception. For
                    // now the gate always allows, so this branch never runs.
                    persistence.endArcadeRun({ deepestSize: currentSize, completed: false })
                    return
                }

                useArcadeRun.getState().setCurrentSize(nextSize)

                if (!loadPuzzleForSize(nextSize)) {
                    // Generator failed — end the run defensively
                    persistence.endArcadeRun({ deepestSize: currentSize, completed: false })
                }
            }
        )
        return () => unsub()
    }, [runId])

    return null
}
