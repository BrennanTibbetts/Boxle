import { useEffect } from 'react'
import useGame, { Phase } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'

export function usePersistenceSync() {
    const configsLength = useGame((state) => state.levelConfigs.length)

    // When puzzles are first populated, restore saved progress or start a new session
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
    }, [configsLength])

    // Save game state to persistence on any meaningful change
    useEffect(() => {
        const unsub = useGame.subscribe((state) => {
            if (!state.levelConfigs.length) return
            usePersistence.getState().saveDaily({
                currentLevel: state.currentLevel,
                lives: state.lives,
                levels: state.levels,
                phase: state.phase,
            })
        })
        return () => unsub()
    }, [])

    // On session complete, update streak and best time stats
    useEffect(() => {
        const unsub = useGame.subscribe(
            (state) => state.phase,
            (phase) => {
                if (phase !== Phase.ENDED) return
                const { lives, startTime, endTime } = useGame.getState()
                if (lives > 0 && startTime && endTime) {
                    usePersistence.getState().completeSession(endTime - startTime)
                } else if (lives === 0) {
                    usePersistence.getState().recordLifeLost()
                }
            }
        )
        return () => unsub()
    }, [])
}
