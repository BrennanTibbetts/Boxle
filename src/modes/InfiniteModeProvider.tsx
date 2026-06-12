import { useEffect, useRef } from 'react'
import useGame, { Phase, GameMode, initGameState, advanceGameState } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import type { InfiniteSave } from '../stores/usePersistence'
import useInfiniteRun, { INFINITE_START_SIZE, INFINITE_MAX_SIZE } from '../stores/useInfiniteRun'
import useIntro from '../stores/useIntro'
import { useIntroLookahead } from '../hooks/useIntroLookahead'
import useUpsell from '../stores/useUpsell'
import useGeneration from '../stores/useGeneration'
import { canPlayAt } from '../utils/gates'
import { takeOrGenerate, generateMany, resetPrefetch } from '../generator/prefetch'
import { topUpLookahead as topUpLookaheadShared, recordPuzzleEnd } from './shared'
import type { DecodedBoard } from '../types/puzzle'

// The depth-wall upsell that fires when the player crosses canPlayAt() in
// Infinite. This is the *only* paywall on Infinite — pool delivery is open to
// everyone (see puzzle_pools public-read migration); the client gate alone
// decides what's playable. Re-enabled now that pools cover the paid 9–12 range
// (the wall previously landed on a generator-broken range, so it was held off).
const INFINITE_DEPTH_GATE_ENABLED = true

// Persist only the render window: the current board plus one played board
// below it (matching LevelManager's `below: 1` preview). Completed boards'
// grids are never read again — an unbounded run would otherwise re-serialize
// hundreds of KB to localStorage every 250ms of play (and push the same blob
// to the profiles row). Absolute run depth survives via puzzlesCompleted, so
// HUD depth and lookahead sizing don't depend on array length (see
// topUpLookahead and HUD's Infinite branch).
const SNAPSHOT_KEEP_BOARDS = 2

function snapshot(): InfiniteSave {
    const game = useGame.getState()
    const run = useInfiniteRun.getState()
    const start = Math.max(0, game.currentLevel - SNAPSHOT_KEEP_BOARDS)
    return {
        currentSize: run.currentSize,
        puzzlesCompleted: run.puzzlesCompleted,
        runHintsUsed: run.runHintsUsed,
        runLivesLost: run.runLivesLost,
        levelConfigs: game.levelConfigs.slice(start, game.currentLevel),
        levels: game.levels.slice(start, game.currentLevel),
        levelMistakes: game.levelMistakes.slice(start, game.currentLevel),
        currentLevel: game.currentLevel - start,
        lives: game.lives,
        sessionHints: game.sessionHints,
        sessionLivesLost: game.sessionLivesLost,
        elapsedMs: game.startTime ? Date.now() - game.startTime : 0,
    }
}

export function InfiniteModeProvider() {
    const runId = useInfiniteRun((s) => s.runId)

    // Leva-tunable intro ladder depth. Held in a ref so the bootstrap effect
    // (keyed on runId) reads the latest value at session start without re-running
    // — and therefore re-generating — every time the knob changes mid-run.
    const introLookahead = useIntroLookahead()
    const introLookaheadRef = useRef(introLookahead)
    introLookaheadRef.current = introLookahead

    useEffect(() => {
        // Cancellation flag for any in-flight worker awaits — prevents a stale
        // generation result from mutating game state after this provider has
        // unmounted (e.g. user changed runs or modes mid-generation).
        let cancelled = false
        const setPending = useGeneration.getState().setPending

        const persistence = usePersistence.getState()
        const infinite = useInfiniteRun.getState()
        const existing = persistence.infiniteSave

        async function bootstrap() {
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
                resetPrefetch('infinite', runId)
                // Resume skips the intro — clear any stale ladder, then rebuild
                // the rolling lookahead so the play preview works immediately.
                useIntro.getState().setSessionBoards([])
                useIntro.getState().setUpcomingBoards([])
                void topUpLookahead()
                return
            }

            // Fresh run.
            persistence.startInfiniteRun()
            resetPrefetch('infinite', runId)
            // Drop the prior session's ladder up front so it doesn't show
            // through while this run's boards generate.
            useIntro.getState().setSessionBoards([])
            useIntro.getState().setUpcomingBoards([])

            setPending(true)
            // Pre-generate the intro ladder: `introBoards` boards of growing
            // size (START, START+1, ...), so the receding stack previews the
            // ramp you're about to climb. Infinite never ends, so this is a
            // fixed lookahead — boards past it generate lazily as today.
            // Fanned out in parallel across the worker pool, then truncated at
            // the first failure so the kept ramp stays contiguous.
            const introLookahead = introLookaheadRef.current
            const sizes = Array.from({ length: introLookahead }, (_, i) =>
                Math.min(INFINITE_START_SIZE + i, INFINITE_MAX_SIZE))
            const results = await generateMany('infinite', sizes)
            if (cancelled) return
            const boards: DecodedBoard[] = []
            for (const board of results) {
                if (!board) break
                boards.push(board)
            }
            setPending(false)

            if (!boards.length) {
                persistence.endInfiniteRun({ deepestSize: 0 })
                useGame.setState({ phase: Phase.ENDED })
                return
            }

            // Publish the ladder before flipping to READY so IntroCamera frames
            // the whole stack from its first frame (no single-board flash). The
            // boards past #1 become the rolling play lookahead (the ghosts shown
            // above the current board), drained by advanceInfiniteTo.
            useIntro.getState().setSessionBoards(boards)
            useIntro.getState().setUpcomingBoards(boards.slice(1))
            useGame.setState(initGameState([boards[0]]))
            infinite.setCurrentSize(boards[0].levelMatrix.length)
            // Persist the freshly initialised state immediately so a reload
            // before any move still resumes the same run.
            persistence.saveInfinite(snapshot())
        }

        void bootstrap()

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

                const run = useInfiniteRun.getState()
                const { isGameOver } = recordPuzzleEnd('infinite', run)

                if (isGameOver) {
                    // Run over — endInfiniteRun also clears infiniteSave.
                    usePersistence.getState().endInfiniteRun({ deepestSize: run.currentSize })
                    return
                }

                run.incrementPuzzlesCompleted()

                // Infinite is, well, infinite. Grid size grows up to
                // INFINITE_MAX_SIZE, then stays there — every subsequent
                // puzzle is a fresh board at the cap size until the player
                // runs out of lives.
                const nextSize = Math.min(run.currentSize + 1, INFINITE_MAX_SIZE)

                if (INFINITE_DEPTH_GATE_ENABLED && !canPlayAt(nextSize, GameMode.INFINITE)) {
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
                        onPurchaseSuccess: () => { void advanceInfiniteTo(nextSize) },
                    })
                    return
                }

                void advanceInfiniteTo(nextSize)
            }
        )

        // Pulled out so the upsell-success callback can resume the advance
        // after a purchase clears the gate. Reads fresh state from the
        // stores rather than closing over the subscriber's snapshot.
        async function advanceInfiniteTo(nextSize: number) {
            const upcoming = useIntro.getState().upcomingBoards
            let next: DecodedBoard | null
            if (upcoming.length > 0) {
                // Drain a board the player already previewed in the play ladder
                // (its size matches the growing-size lookahead).
                next = upcoming[0]
                useIntro.getState().setUpcomingBoards(upcoming.slice(1))
            } else {
                setPending(true)
                next = await takeOrGenerate('infinite', nextSize)
                if (cancelled) return
                setPending(false)
            }

            const run = useInfiniteRun.getState()
            if (!next) {
                usePersistence.getState().endInfiniteRun({ deepestSize: run.currentSize })
                return
            }
            const size = next.levelMatrix.length
            if (size !== run.currentSize) run.setCurrentSize(size)
            useGame.setState(advanceGameState(useGame.getState(), next))
            usePersistence.getState().saveInfinite(snapshot())
            // Keep the lookahead refilled so the play ladder always previews the
            // upcoming boards above the current one (not just the initial five).
            void topUpLookahead()
        }

        function topUpLookahead() {
            return topUpLookaheadShared('infinite', {
                isCancelled: () => cancelled,
                // Index of the next board in the full session = boards already
                // played (absolute, from the run counters — levelConfigs is a
                // trimmed window after a resume) + boards already queued ahead.
                nextSize: (upcomingCount) => {
                    const nextIndex = useInfiniteRun.getState().puzzlesCompleted + 1 + upcomingCount
                    return Math.min(INFINITE_START_SIZE + nextIndex, INFINITE_MAX_SIZE)
                },
            })
        }

        return () => {
            cancelled = true
            // Clear pending so the spinner doesn't linger after unmount.
            useGeneration.getState().setPending(false)
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
