import { useEffect } from 'react'
import puzzleDataRaw from '../../data/puzzles.js'
import type { RawPuzzle } from '../types/puzzle'
import { useDailyPuzzles } from '../hooks/useDailyPuzzles'
import useGame, { Phase, deriveSessionOutcome } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import { todayISO } from '../utils/date'

// puzzles.js is untyped generated wiring over the bundled JSON pools — the
// double-cast is the typed seam; the shape is guaranteed by puzzle-generator.
const puzzleData = puzzleDataRaw as unknown as RawPuzzle[][]

// Daily orchestrator. Structured like InfiniteModeProvider/LibraryModeProvider
// — bootstrap, autosave, and end-of-session recording live here, in effects —
// so the three modes read the same way. Daily differs in that its whole
// session loads up front from the bundled pool (no lazy generation, no
// lookahead) and its save slot is keyed to today's date.
export function DailyModeProvider() {
    useDailyPuzzles(puzzleData)

    const configsLength = useGame((state) => state.levelConfigs.length)

    // When puzzles are first populated: restore saved progress (or start new
    // session), then begin saving. Save subscription is intentionally created
    // AFTER restore so that the blank grids written by populatePuzzles don't
    // overwrite saved state.
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

        // Saves subscribe to the persisted slices only and debounce into one
        // trailing write — drag-marking fires one useGame set per box crossed,
        // and every saveDaily serializes the whole persist blob to
        // localStorage synchronously. Phase changes flush immediately so an
        // ENDED session can't be lost to the debounce window.
        let saveTimer: ReturnType<typeof setTimeout> | null = null
        const save = () => {
            if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
            const state = useGame.getState()
            usePersistence.getState().saveDaily({
                currentLevel: state.currentLevel,
                lives: state.lives,
                levels: state.levels,
                phase: state.phase,
                elapsedMs: state.startTime ? Date.now() - state.startTime : 0,
            })
        }
        const scheduleSave = () => {
            if (saveTimer) clearTimeout(saveTimer)
            saveTimer = setTimeout(save, 250)
        }
        const unsubs = [
            useGame.subscribe((state) => state.levels, scheduleSave),
            useGame.subscribe((state) => state.lives, scheduleSave),
            useGame.subscribe((state) => state.currentLevel, scheduleSave),
            useGame.subscribe((state) => state.phase, save),
        ]
        return () => {
            unsubs.forEach((unsub) => unsub())
            // Flush any pending debounced save, and capture elapsedMs at
            // unmount — state-driven saves miss any idle time between the
            // last action and the user leaving.
            if (saveTimer !== null || useGame.getState().phase === Phase.PLAYING) save()
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

                const { isComplete, elapsedMs, levelCount, levelsCompleted } = deriveSessionOutcome({
                    lives, startTime, endTime, currentLevel, levelCount: levelConfigs.length,
                })

                usePersistence.getState().recordDailySessionEnd({
                    livesLost: sessionLivesLost,
                    completedTimeMs: isComplete && elapsedMs !== null ? elapsedMs : null,
                    result: {
                        date: todayISO(),
                        isComplete,
                        levelsCompleted,
                        levelCount,
                        elapsedMs,
                        hintsUsed: sessionHints,
                        livesLost: sessionLivesLost,
                        levelMistakes: [...levelMistakes],
                    },
                })
            }
        )
        return () => unsub()
    }, [])

    return null
}
