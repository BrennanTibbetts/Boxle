import { useEffect } from 'react'
import useGame, { Phase, GameMode } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'

export function usePersistenceSync() {
    const configsLength = useGame((state) => state.levelConfigs.length)

    // Check streak expiry once on mount
    useEffect(() => {
        usePersistence.getState().checkStreakExpiry()
    }, [])

    // When puzzles are first populated: restore saved progress (or start new session),
    // then begin saving. Save subscription is intentionally created AFTER restore so
    // that the blank grids written by populatePuzzles don't overwrite saved state.
    useEffect(() => {
        if (!configsLength) return

        const saved = usePersistence.getState().loadDaily()
        if (saved) {
            useGame.setState({
                currentLevel: saved.currentLevel,
                lives: saved.lives,
                levels: saved.levels,
                phase: saved.phase,
                startTime: Date.now() - (saved.elapsedMs ?? 0),
            })
        } else {
            usePersistence.getState().startDailySession()
        }

        const unsub = useGame.subscribe((state) => {
            usePersistence.getState().saveDaily({
                currentLevel: state.currentLevel,
                lives: state.lives,
                levels: state.levels,
                phase: state.phase,
                elapsedMs: state.startTime ? Date.now() - state.startTime : 0,
            })
        })
        return () => {
            unsub()
            // Capture elapsedMs at unmount — state-driven saves miss any
            // idle time between the last action and the user leaving.
            const state = useGame.getState()
            if (state.phase === Phase.PLAYING) {
                usePersistence.getState().saveDaily({
                    currentLevel: state.currentLevel,
                    lives: state.lives,
                    levels: state.levels,
                    phase: state.phase,
                    elapsedMs: state.startTime ? Date.now() - state.startTime : 0,
                })
            }
        }
    }, [configsLength])

    // On session end, record mistakes, (on win) update streak and best time,
    // and snapshot today's result for the main-menu performance modal.
    useEffect(() => {
        const unsub = useGame.subscribe(
            (state) => state.phase,
            (phase) => {
                if (phase !== Phase.ENDED) return
                const game = useGame.getState()
                const { lives, startTime, endTime, sessionLivesLost, sessionHints, currentLevel, levelConfigs, levelMistakes } = game
                const persistence = usePersistence.getState()

                persistence.recordLivesLost(GameMode.DAILY, sessionLivesLost)

                const isComplete = lives > 0
                const elapsedMs = startTime && endTime ? endTime - startTime : null
                const levelCount = levelConfigs.length
                const levelsCompleted = isComplete ? levelCount : currentLevel - 1

                if (isComplete && elapsedMs !== null) {
                    persistence.completeDailySession(elapsedMs)
                }

                persistence.recordDailyResult({
                    date: new Date().toISOString().slice(0, 10),
                    isComplete,
                    levelsCompleted,
                    levelCount,
                    elapsedMs,
                    hintsUsed: sessionHints,
                    livesLost: sessionLivesLost,
                    levelMistakes: [...levelMistakes],
                })
            }
        )
        return () => unsub()
    }, [])
}
