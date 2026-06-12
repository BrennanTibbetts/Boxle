import useGame from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useIntro, { PLAY_LOOKAHEAD } from '../stores/useIntro'
import { takeOrGenerate } from '../generator/prefetch'
import type { Namespace } from '../generator/poolSource'

// Flow pieces shared by InfiniteModeProvider and LibraryModeProvider — the
// two lazily-generating modes. These were verbatim copy-paste between the
// providers, so a fix in one silently missed the other. The genuinely
// mode-specific parts (resume, depth gate, batch overlays, what happens on
// game over) stay in the providers; these helpers only own the common core.

/**
 * Keep PLAY_LOOKAHEAD boards generated ahead of the current play position —
 * enough to render the above-ghost(s) and buffer the next advance, without
 * loading the whole ladder. Runs in the background (no spinner); if
 * generation can't keep pace, the advance path falls back to on-demand
 * generation.
 *
 * `nextSize` maps how-many-are-already-queued to the next board's size, or
 * null to stop early (Library: don't pre-generate past the batch's end).
 */
export async function topUpLookahead(ns: Namespace, opts: {
    isCancelled: () => boolean
    nextSize: (upcomingCount: number) => number | null
}): Promise<void> {
    while (!opts.isCancelled()) {
        const upcoming = useIntro.getState().upcomingBoards
        if (upcoming.length >= PLAY_LOOKAHEAD) break
        const size = opts.nextSize(upcoming.length)
        if (size === null) break
        const board = await takeOrGenerate(ns, size)
        if (opts.isCancelled() || !board) break
        useIntro.getState().setUpcomingBoards([...useIntro.getState().upcomingBoards, board])
    }
}

/**
 * Shared ENDED-phase prologue: record lives lost against the mode's stats,
 * roll the per-puzzle session counters up into the run/batch store, and
 * report whether this end was a game over (lives exhausted) — the caller
 * branches on that with its own mode-specific consequence (end the run /
 * show the game-over overlay).
 */
export function recordPuzzleEnd(
    mode: 'infinite' | 'library',
    run: { addPuzzleStats: (hints: number, livesLost: number) => void },
): { isGameOver: boolean } {
    const game = useGame.getState()
    if (game.sessionLivesLost > 0) {
        usePersistence.getState().recordLivesLost(mode, game.sessionLivesLost)
    }
    run.addPuzzleStats(game.sessionHints, game.sessionLivesLost)
    return { isGameOver: game.lives === 0 }
}
