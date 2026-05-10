import { useEffect } from 'react'
import useGame, { Phase, GameMode, initGameState, advanceGameState } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import type { InfiniteSave } from '../stores/usePersistence'
import useInfiniteRun, { INFINITE_START_SIZE, INFINITE_MAX_SIZE } from '../stores/useInfiniteRun'
import useUpsell from '../stores/useUpsell'
import { canPlayAt } from '../utils/gates'
import { prefetchPuzzle, takeOrGenerate, resetPrefetch } from '../generator/prefetch'

function snapshot(): InfiniteSave {
    const game = useGame.getState()
    const run = useInfiniteRun.getState()
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
        elapsedMs: game.startTime ? Date.now() - game.startTime : 0,
    }
}

export function InfiniteModeProvider() {
    const runId = useInfiniteRun((s) => s.runId)

    useEffect(() => {
        const persistence = usePersistence.getState()
        const infinite = useInfiniteRun.getState()
        const existing = persistence.infiniteSave

        if (existing) {
            // Resume: restore previous run state into useGame + useInfiniteRun.
            // Note: we deliberately do NOT call startInfiniteRun here — that
            // counter is for runs *started*, not resumed.
            useGame.setState({
                levelConfigs: existing.levelConfigs,
                levels: existing.levels,
                levelMistakes: existing.levelMistakes,
                currentLevel: existing.currentLevel,
                phase: Phase.PLAYING,
                startTime: Date.now() - (existing.elapsedMs ?? 0),
                endTime: null,
                wrongPlacement: null,
                lastBoxlePosition: null,
                lives: existing.lives,
                sessionHints: existing.sessionHints,
                sessionLivesLost: existing.sessionLivesLost,
            })
            useInfiniteRun.setState({
                currentSize: existing.currentSize,
                puzzlesCompleted: existing.puzzlesCompleted,
                runHintsUsed: existing.runHintsUsed,
                runLivesLost: existing.runLivesLost,
            })
            resetPrefetch('infinite')
            prefetchPuzzle('infinite', Math.min(existing.currentSize + 1, INFINITE_MAX_SIZE))
        } else {
            // Fresh run.
            persistence.startInfiniteRun()
            resetPrefetch('infinite')

            const first = takeOrGenerate('infinite', INFINITE_START_SIZE)
            if (!first) {
                persistence.endInfiniteRun({ deepestSize: 0 })
                useGame.setState({ phase: Phase.ENDED })
                return
            }

            useGame.setState(initGameState([first]))
            infinite.setCurrentSize(INFINITE_START_SIZE)
            prefetchPuzzle('infinite', Math.min(INFINITE_START_SIZE + 1, INFINITE_MAX_SIZE))
            // Persist the freshly initialised state immediately so a reload
            // before any move still resumes the same run.
            persistence.saveInfinite(snapshot())
        }

        // Debounced auto-save — flushes ~250ms after any relevant state change.
        let saveTimeout: ReturnType<typeof setTimeout> | null = null
        const scheduleSave = () => {
            if (useGame.getState().phase !== Phase.PLAYING) return
            if (saveTimeout !== null) clearTimeout(saveTimeout)
            saveTimeout = setTimeout(() => {
                if (useGame.getState().phase !== Phase.PLAYING) return
                usePersistence.getState().saveInfinite(snapshot())
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
                const run = useInfiniteRun.getState()

                if (game.sessionLivesLost > 0) {
                    persistence.recordLivesLost('infinite', game.sessionLivesLost)
                }
                run.addPuzzleStats(game.sessionHints, game.sessionLivesLost)

                if (game.lives === 0) {
                    // Run over — endInfiniteRun also clears infiniteSave.
                    persistence.endInfiniteRun({ deepestSize: run.currentSize })
                    return
                }

                run.incrementPuzzlesCompleted()

                // Infinite is, well, infinite. Grid size grows up to
                // INFINITE_MAX_SIZE, then stays there — every subsequent
                // puzzle is a fresh board at the cap size until the player
                // runs out of lives.
                const nextSize = Math.min(run.currentSize + 1, INFINITE_MAX_SIZE)

                if (!canPlayAt(nextSize, GameMode.INFINITE)) {
                    // Free-tier depth wall: leave the run in ENDED phase but
                    // hold off on calling endInfiniteRun. The upsell modal is
                    // the next surface — dismiss ends the run (revealing the
                    // standard EndScreen underneath); a successful purchase
                    // resumes the advance at nextSize.
                    useUpsell.getState().openUpsell({
                        reason: 'infinite-depth',
                        onDismiss: () => {
                            usePersistence.getState().endInfiniteRun({
                                deepestSize: useInfiniteRun.getState().currentSize,
                            })
                        },
                        onPurchaseSuccess: () => advanceInfiniteTo(nextSize),
                    })
                    return
                }

                advanceInfiniteTo(nextSize)
            }
        )

        // Pulled out so the upsell-success callback can resume the advance
        // after a purchase clears the gate. Reads fresh state from the
        // stores rather than closing over the subscriber's snapshot.
        function advanceInfiniteTo(nextSize: number) {
            const next = takeOrGenerate('infinite', nextSize)
            const run = useInfiniteRun.getState()
            if (!next) {
                usePersistence.getState().endInfiniteRun({ deepestSize: run.currentSize })
                return
            }
            if (nextSize !== run.currentSize) run.setCurrentSize(nextSize)
            prefetchPuzzle('infinite', Math.min(nextSize + 1, INFINITE_MAX_SIZE))
            useGame.setState(advanceGameState(useGame.getState(), next))
            usePersistence.getState().saveInfinite(snapshot())
        }

        return () => {
            unsubPhase()
            unsubLevels()
            unsubLives()
            unsubLevelConfigs()
            if (saveTimeout !== null) clearTimeout(saveTimeout)
            // Always snapshot on unmount so elapsedMs reflects time spent
            // since the last state-driven save (e.g. idle time before the
            // user navigated away).
            if (useGame.getState().phase === Phase.PLAYING) {
                usePersistence.getState().saveInfinite(snapshot())
            }
        }
    }, [runId])

    return null
}
