import { useEffect } from 'react'
import useGame, { Phase, BoxState } from '../stores/useGame'
import type { BoxStateValue, LevelGrid } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useLibraryRun, { LIBRARY_BATCH_SIZE } from '../stores/useLibraryRun'
import { generateBoard } from '../generator/generate'
import { decodeBoard } from '../utils/puzzle'
import LibraryTierPicker from '../interface/LibraryTierPicker'
import LibraryBatchComplete from '../interface/LibraryBatchComplete'

function makeBlankGrid(size: number): LevelGrid {
    return Array.from({ length: size }, () =>
        new Array<BoxStateValue>(size).fill(BoxState.BLANK)
    )
}

function loadFreshPuzzle(size: number): boolean {
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
        lives: 3,
        sessionHints: 0,
        sessionLivesLost: 0,
        levelMistakes: [0],
    })
    return true
}

export function LibraryModeProvider() {
    const activeTierSize = useLibraryRun((s) => s.activeTierSize)
    const showBatchComplete = useLibraryRun((s) => s.showBatchComplete)

    // Load a fresh puzzle whenever a tier becomes active or after batch is dismissed.
    useEffect(() => {
        if (activeTierSize === null) return
        if (showBatchComplete) return
        loadFreshPuzzle(activeTierSize)
    }, [activeTierSize, showBatchComplete])

    // Watch for puzzle completion / failure
    useEffect(() => {
        if (activeTierSize === null) return

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

                if (game.lives === 0) {
                    // Failed — silent retry with a fresh puzzle of the same size.
                    loadFreshPuzzle(activeTierSize)
                    return
                }

                // Puzzle solved.
                persistence.recordLibraryPuzzleCompletion(activeTierSize)
                const completedAfter = libRun.puzzlesCompletedInTier + 1
                libRun.incrementCompleted()

                if (completedAfter >= LIBRARY_BATCH_SIZE) {
                    // Batch complete. Unlocking the next size is idempotent — replays
                    // of already-unlocked tiers are no-ops.
                    persistence.unlockLibrarySize(activeTierSize + 1)
                    libRun.markBatchComplete()
                    return
                }

                // Advance silently to the next puzzle in the batch.
                loadFreshPuzzle(activeTierSize)
            }
        )
        return () => unsub()
    }, [activeTierSize])

    if (activeTierSize === null) return <LibraryTierPicker />
    if (showBatchComplete) return <LibraryBatchComplete />
    return null
}
