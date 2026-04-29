import { useEffect } from 'react'
import useGame, { Phase, GameMode, initGameState, advanceGameState } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import type { ArcadeSave } from '../stores/usePersistence'
import useArcadeRun, { ARCADE_START_SIZE, ARCADE_MAX_SIZE } from '../stores/useArcadeRun'
import { canPlayAt } from '../utils/gates'
import { prefetchPuzzle, takeOrGenerate, resetPrefetch } from '../generator/prefetch'

function snapshot(): ArcadeSave {
    const game = useGame.getState()
    const run = useArcadeRun.getState()
    return {
        currentSize: run.currentSize,
        puzzlesCompleted: run.puzzlesCompleted,
        runHintsUsed: run.runHintsUsed,
        runLivesLost: run.runLivesLost,
        levelConfigs: game.levelConfigs,
        levels: game.levels,
        levelMistakes: game.levelMistakes,
        currentLevel: game.currentLevel,
        lives: game.lives,
        sessionHints: game.sessionHints,
        sessionLivesLost: game.sessionLivesLost,
    }
}

export function ArcadeModeProvider() {
    const runId = useArcadeRun((s) => s.runId)

    useEffect(() => {
        const persistence = usePersistence.getState()
        const arcade = useArcadeRun.getState()
        const existing = persistence.arcadeSave

        if (existing) {
            // Resume: restore previous run state into useGame + useArcadeRun.
            // Note: we deliberately do NOT call startArcadeRun here — that
            // counter is for runs *started*, not resumed.
            useGame.setState({
                levelConfigs: existing.levelConfigs,
                levels: existing.levels,
                levelMistakes: existing.levelMistakes,
                currentLevel: existing.currentLevel,
                phase: Phase.PLAYING,
                startTime: Date.now(),
                endTime: null,
                wrongPlacement: null,
                lastBoxlePosition: null,
                lives: existing.lives,
                sessionHints: existing.sessionHints,
                sessionLivesLost: existing.sessionLivesLost,
            })
            useArcadeRun.setState({
                currentSize: existing.currentSize,
                puzzlesCompleted: existing.puzzlesCompleted,
                runHintsUsed: existing.runHintsUsed,
                runLivesLost: existing.runLivesLost,
            })
            resetPrefetch('arcade')
            prefetchPuzzle('arcade', Math.min(existing.currentSize + 1, ARCADE_MAX_SIZE))
        } else {
            // Fresh run.
            persistence.startArcadeRun()
            resetPrefetch('arcade')

            const first = takeOrGenerate('arcade', ARCADE_START_SIZE)
            if (!first) {
                persistence.endArcadeRun({ deepestSize: 0 })
                useGame.setState({ phase: Phase.ENDED })
                return
            }

            useGame.setState(initGameState([first]))
            arcade.setCurrentSize(ARCADE_START_SIZE)
            prefetchPuzzle('arcade', Math.min(ARCADE_START_SIZE + 1, ARCADE_MAX_SIZE))
            // Persist the freshly initialised state immediately so a reload
            // before any move still resumes the same run.
            persistence.saveArcade(snapshot())
        }

        // Debounced auto-save — flushes ~250ms after any relevant state change.
        let saveTimeout: ReturnType<typeof setTimeout> | null = null
        const scheduleSave = () => {
            if (useGame.getState().phase !== Phase.PLAYING) return
            if (saveTimeout !== null) clearTimeout(saveTimeout)
            saveTimeout = setTimeout(() => {
                if (useGame.getState().phase !== Phase.PLAYING) return
                usePersistence.getState().saveArcade(snapshot())
                saveTimeout = null
            }, 250)
        }
        const unsubLevels = useGame.subscribe((s) => s.levels, scheduleSave)
        const unsubLives = useGame.subscribe((s) => s.lives, scheduleSave)
        const unsubLevelConfigs = useGame.subscribe((s) => s.levelConfigs, scheduleSave)

        const unsubPhase = useGame.subscribe(
            (state) => state.phase,
            (phase, prevPhase) => {
                if (phase !== Phase.ENDED || prevPhase === Phase.ENDED) return

                const game = useGame.getState()
                const run = useArcadeRun.getState()

                if (game.sessionLivesLost > 0) {
                    persistence.recordLivesLost('arcade', game.sessionLivesLost)
                }
                run.addPuzzleStats(game.sessionHints, game.sessionLivesLost)

                if (game.lives === 0) {
                    // Run over — endArcadeRun also clears arcadeSave.
                    persistence.endArcadeRun({ deepestSize: run.currentSize })
                    return
                }

                run.incrementPuzzlesCompleted()

                // Arcade is infinite. Grid size grows up to ARCADE_MAX_SIZE, then
                // stays there — every subsequent puzzle is a fresh board at the
                // cap size until the player runs out of lives.
                const nextSize = Math.min(run.currentSize + 1, ARCADE_MAX_SIZE)

                if (!canPlayAt(nextSize, GameMode.ARCADE)) {
                    persistence.endArcadeRun({ deepestSize: run.currentSize })
                    return
                }

                const next = takeOrGenerate('arcade', nextSize)
                if (!next) {
                    persistence.endArcadeRun({ deepestSize: run.currentSize })
                    return
                }

                if (nextSize !== run.currentSize) run.setCurrentSize(nextSize)
                prefetchPuzzle('arcade', Math.min(nextSize + 1, ARCADE_MAX_SIZE))

                // lives preserved across puzzles for the run
                useGame.setState(advanceGameState(game, next))
                // Save right after advance so the new level is in the snapshot.
                usePersistence.getState().saveArcade(snapshot())
            }
        )

        return () => {
            unsubPhase()
            unsubLevels()
            unsubLives()
            unsubLevelConfigs()
            // Flush any pending debounced save before unmount.
            if (saveTimeout !== null) {
                clearTimeout(saveTimeout)
                if (useGame.getState().phase === Phase.PLAYING) {
                    usePersistence.getState().saveArcade(snapshot())
                }
            }
        }
    }, [runId])

    return null
}
