import { useEffect } from 'react'
import useGame, { Phase } from '../stores/useGame'
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
            })
        } else {
            usePersistence.getState().startSession()
        }

        const unsub = useGame.subscribe((state) => {
            usePersistence.getState().saveDaily({
                currentLevel: state.currentLevel,
                lives: state.lives,
                levels: state.levels,
                phase: state.phase,
            })
        })
        return () => unsub()
    }, [configsLength])

    // On session end, record mistakes and (on win) update streak and best time
    useEffect(() => {
        const unsub = useGame.subscribe(
            (state) => state.phase,
            (phase) => {
                if (phase !== Phase.ENDED) return
                const { lives, startTime, endTime, sessionLivesLost } = useGame.getState()
                const persistence = usePersistence.getState()

                if (sessionLivesLost > 0) {
                    persistence.recordMistakes(sessionLivesLost)
                }

                if (lives > 0 && startTime && endTime) {
                    persistence.completeSession(endTime - startTime)
                }
            }
        )
        return () => unsub()
    }, [])
}
