import { useEffect } from 'react'
import useGame, { Phase, BoxState } from '../stores/useGame'
import type { BoxStateValue, LevelGrid } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useLibraryRun, { LIBRARY_BATCH_SIZE } from '../stores/useLibraryRun'
import { prefetchPuzzle, takeOrGenerate, resetPrefetch } from '../generator/prefetch'
import LibraryTierPicker from '../interface/LibraryTierPicker'
import LibraryBatchComplete from '../interface/LibraryBatchComplete'
import LibraryGameOver from '../interface/LibraryGameOver'

function makeBlankGrid(size: number): LevelGrid {
    return Array.from({ length: size }, () =>
        new Array<BoxStateValue>(size).fill(BoxState.BLANK)
    )
}

export function LibraryModeProvider() {
    const activeTierSize = useLibraryRun((s) => s.activeTierSize)
    const batchId = useLibraryRun((s) => s.batchId)
    const showBatchComplete = useLibraryRun((s) => s.showBatchComplete)
    const showGameOver = useLibraryRun((s) => s.showGameOver)

    // Fresh batch start: reset game state with puzzle #1.
    useEffect(() => {
        if (activeTierSize === null) return
        if (showBatchComplete || showGameOver) return

        resetPrefetch('library')
        const first = takeOrGenerate('library', activeTierSize)
        if (!first) return
        useGame.setState({
            levelConfigs: [first],
            levels: [makeBlankGrid(activeTierSize)],
            levelMistakes: [0],
            currentLevel: 1,
            phase: Phase.PLAYING,
            startTime: Date.now(),
            endTime: null,
            wrongPlacement: null,
            lastBoxlePosition: null,
            lives: 3,
            sessionHints: 0,
            sessionLivesLost: 0,
        })
        // Prefetch the next puzzle in the batch (same size).
        prefetchPuzzle('library', activeTierSize)
    }, [activeTierSize, batchId])

    // Watch for puzzle completion / game over within an active batch.
    useEffect(() => {
        if (activeTierSize === null) return
        if (showBatchComplete || showGameOver) return

        const unsub = useGame.subscribe(
            (state) => state.phase,
            (phase, prevPhase) => {
                if (phase !== Phase.ENDED || prevPhase === Phase.ENDED) return

                const game = useGame.getState()
                const persistence = usePersistence.getState()
                const libRun = useLibraryRun.getState()

                if (game.sessionLivesLost > 0) {
                    persistence.recordLivesLost('library', game.sessionLivesLost)
                }
                libRun.addPuzzleStats(game.sessionHints, game.sessionLivesLost)

                if (game.lives === 0) {
                    libRun.markGameOver()
                    return
                }

                // Puzzle solved.
                persistence.recordLibraryPuzzleCompletion(activeTierSize)
                const completedAfter = libRun.puzzlesCompletedInTier + 1
                libRun.incrementCompleted()

                if (completedAfter >= LIBRARY_BATCH_SIZE) {
                    persistence.unlockLibrarySize(activeTierSize + 1)
                    libRun.markBatchComplete()
                    return
                }

                // Generate the next puzzle in this batch and stack it on.
                const next = takeOrGenerate('library', activeTierSize)
                if (!next) {
                    libRun.markGameOver()
                    return
                }

                const newLevelNumber = game.levelConfigs.length + 1
                useGame.setState({
                    levelConfigs: [...game.levelConfigs, next],
                    levels: [...game.levels, makeBlankGrid(activeTierSize)],
                    levelMistakes: [...game.levelMistakes, 0],
                    currentLevel: newLevelNumber,
                    phase: Phase.PLAYING,
                    startTime: Date.now(),
                    endTime: null,
                    wrongPlacement: null,
                    lastBoxlePosition: null,
                    sessionHints: 0,
                    sessionLivesLost: 0,
                    // lives preserved across the batch
                })
                // Prefetch one more for the next advance.
                prefetchPuzzle('library', activeTierSize)
            }
        )
        return () => unsub()
    }, [activeTierSize, batchId, showBatchComplete, showGameOver])

    if (activeTierSize === null) return <LibraryTierPicker />
    if (showGameOver) return <LibraryGameOver />
    if (showBatchComplete) return <LibraryBatchComplete />
    return null
}
