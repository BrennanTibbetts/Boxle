import { useEffect, useRef } from 'react'
import useGame, { Phase, initGameState, advanceGameState } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useLibraryRun, { LIBRARY_BATCH_SIZE } from '../stores/useLibraryRun'
import useIntro from '../stores/useIntro'
import { useIntroLookahead } from '../hooks/useIntroLookahead'
import useGeneration from '../stores/useGeneration'
import { prefetchPuzzle, takeOrGenerate, generateMany, resetPrefetch } from '../generator/prefetch'
import { topUpLookahead as topUpLookaheadShared, recordPuzzleEnd } from './shared'
import type { DecodedBoard } from '../types/puzzle'
import LibraryTierPicker from '../interface/LibraryTierPicker'
import LibraryBatchComplete from '../interface/LibraryBatchComplete'
import LibraryGameOver from '../interface/LibraryGameOver'

export function LibraryModeProvider() {
    const activeTierSize = useLibraryRun((s) => s.activeTierSize)
    const batchId = useLibraryRun((s) => s.batchId)
    const showBatchComplete = useLibraryRun((s) => s.showBatchComplete)
    const showGameOver = useLibraryRun((s) => s.showGameOver)

    // Leva-tunable intro ladder depth, held in a ref so the bootstrap effect
    // reads the latest value at batch start without re-running on every change.
    const introLookahead = useIntroLookahead()
    const introLookaheadRef = useRef(introLookahead)
    introLookaheadRef.current = introLookahead

    // The not-yet-played lookahead lives in useIntro.upcomingBoards: the advance
    // handler drains it before falling back to fresh generation (so the boards
    // you previewed are the boards you play), and keeps it topped up so the play
    // ladder always previews the upcoming boards above the current one.

    // Fresh batch start: pre-generate the intro lookahead, open on puzzle #1.
    useEffect(() => {
        if (activeTierSize === null) return
        if (showBatchComplete || showGameOver) return

        let cancelled = false
        const setPending = useGeneration.getState().setPending
        const size = activeTierSize

        async function bootstrap() {
            // Seed pool selection per batch + tier so a batch draws a
            // deterministic, no-repeat sequence of distinct boards.
            resetPrefetch('library', batchId * 100 + size)
            // Drop the prior session's ladder up front so it doesn't show
            // through while this batch's boards generate.
            useIntro.getState().setSessionBoards([])
            useIntro.getState().setUpcomingBoards([])
            setPending(true)

            // Pre-generate the intro ladder: up to `introBoards` boards, but
            // never more than the batch has left. Same size, so they stack into
            // a clean receding ladder. Generated in parallel across the worker
            // pool (generateMany never dedupes same-size, so these are distinct
            // boards), then truncated at the first failure.
            const wanted = Math.min(introLookaheadRef.current, LIBRARY_BATCH_SIZE)
            const results = await generateMany('library', Array.from({ length: wanted }, () => size))
            if (cancelled) return
            const boards: DecodedBoard[] = []
            for (const board of results) {
                if (!board) break
                boards.push(board)
            }
            setPending(false)
            if (!boards.length) return

            // Publish the ladder before flipping to READY so IntroCamera frames
            // the whole stack from its first frame (no single-board flash). The
            // boards past #1 become the rolling play lookahead (the ghosts shown
            // above the current board), drained by advanceToNext.
            useIntro.getState().setSessionBoards(boards)
            useIntro.getState().setUpcomingBoards(boards.slice(1))
            useGame.setState(initGameState([boards[0]]))
            // Warm the cache for the first board past the lookahead.
            prefetchPuzzle('library', size)
        }

        void bootstrap()

        return () => {
            cancelled = true
            useGeneration.getState().setPending(false)
        }
    }, [activeTierSize, batchId])

    // Watch for puzzle completion / game over within an active batch.
    useEffect(() => {
        if (activeTierSize === null) return
        if (showBatchComplete || showGameOver) return

        // Narrowed once here — the guard above doesn't carry into the
        // closures below (they run later, from subscribers).
        const tierSize: number = activeTierSize
        let cancelled = false
        const setPending = useGeneration.getState().setPending

        const unsub = useGame.subscribe(
            (state) => state.phase,
            (phase, prevPhase) => {
                if (phase !== Phase.ENDED || prevPhase === Phase.ENDED) return

                const libRun = useLibraryRun.getState()
                const { isGameOver } = recordPuzzleEnd('library', libRun)

                if (isGameOver) {
                    libRun.markGameOver()
                    return
                }

                // Puzzle solved.
                usePersistence.getState().recordLibraryPuzzleCompletion(activeTierSize)
                const completedAfter = libRun.puzzlesCompletedInTier + 1
                libRun.incrementCompleted()

                if (completedAfter >= LIBRARY_BATCH_SIZE) {
                    usePersistence.getState().unlockLibrarySize(activeTierSize + 1)
                    libRun.markBatchComplete()
                    return
                }

                void advanceToNext()
            }
        )

        async function advanceToNext() {
            const upcoming = useIntro.getState().upcomingBoards
            let next: DecodedBoard | null
            if (upcoming.length > 0) {
                // Drain a board the player already previewed in the play ladder.
                next = upcoming[0]
                useIntro.getState().setUpcomingBoards(upcoming.slice(1))
            } else {
                setPending(true)
                next = await takeOrGenerate('library', tierSize)
                if (cancelled) return
                setPending(false)
            }

            if (!next) {
                useLibraryRun.getState().markGameOver()
                return
            }
            // lives preserved across the batch
            useGame.setState(advanceGameState(useGame.getState(), next))
            // Refill the lookahead so the play ladder keeps previewing boards
            // above the current one (bounded by what's left in the batch).
            void topUpLookahead()
        }

        // Library tiers are uniform-size, so every board is the tier size —
        // but never pre-generate past the boards this batch will ever play.
        function topUpLookahead() {
            return topUpLookaheadShared('library', {
                isCancelled: () => cancelled,
                nextSize: (upcomingCount) => {
                    const loaded = useGame.getState().levelConfigs.length + upcomingCount
                    return loaded >= LIBRARY_BATCH_SIZE ? null : tierSize
                },
            })
        }

        return () => {
            cancelled = true
            useGeneration.getState().setPending(false)
            unsub()
        }
    }, [activeTierSize, batchId, showBatchComplete, showGameOver])

    if (activeTierSize === null) return <LibraryTierPicker />
    if (showGameOver) return <LibraryGameOver />
    if (showBatchComplete) return <LibraryBatchComplete />
    return null
}
