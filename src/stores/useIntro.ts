import { create } from 'zustand'
import type { DecodedBoard } from '../types/puzzle'

// How many of the session's upcoming boards to frame in the board-intro ladder.
// Daily already has all its puzzles loaded up front, so it ignores this and
// shows them all. Library/Infinite generate lazily, so they pre-generate up to
// this many boards before the intro so the ladder isn't a lonely single board.
// Bounded so the pre-generation wait (and the receding ladder's depth) stay
// reasonable — Library batches are 10 and Infinite is endless.
export const INTRO_LOOKAHEAD = 5

// How many not-yet-played boards to keep generated ahead during *play* (the
// rolling `upcomingBoards` lookahead). The play ladder only previews a board or
// two above the current one, so this is small — just enough to render the
// above-ghost(s) and keep one buffered so the next advance is instant. Much
// smaller than INTRO_LOOKAHEAD: in play we don't load the whole ladder.
export const PLAY_LOOKAHEAD = 2

// Transient bridge between the HTML Start button (Interface tree) and the
// in-canvas IntroCamera (Canvas tree). `transitioning` is true from the moment
// the player hits Start until the fly-in to the play pose completes, at which
// point IntroCamera flips the game to PLAYING and resets this. Not persisted —
// it only exists for the duration of one board-intro.
//
// `sessionBoards` is the ordered list of boards framed in the board-intro
// ladder (board #1 first). Daily leaves it empty and the renderer falls back to
// the already-loaded levelConfigs. Library/Infinite populate it with their
// pre-generated lookahead. It's used during the READY intro phase to frame the
// whole stack; mode providers own its lifecycle (cleared on a fresh session,
// overwritten once boards are ready), so `reset` (fired on every Start) leaves
// it intact.
//
// `upcomingBoards` is the *rolling* lookahead during play: the not-yet-played
// boards immediately ahead of the current one. LevelManager renders them as
// inert ghosts above the board you're solving so you always see a preview of
// what's coming, and the mode providers drain it on advance (the boards you
// previewed are the boards you play). Providers keep it topped up to a fixed
// depth in the background, so the preview survives arbitrarily deep into an
// Infinite run — not just the initial INTRO_LOOKAHEAD boards. levelConfigs is
// always a prefix of [...levelConfigs, ...upcomingBoards], so ghost z-positions
// match where each board lands once advanced (and agree with CameraManager).
interface IntroState {
    transitioning: boolean
    sessionBoards: DecodedBoard[]
    upcomingBoards: DecodedBoard[]
    begin: () => void
    setSessionBoards: (boards: DecodedBoard[]) => void
    setUpcomingBoards: (boards: DecodedBoard[]) => void
    reset: () => void
}

const useIntro = create<IntroState>((set) => ({
    transitioning: false,
    sessionBoards: [],
    upcomingBoards: [],
    begin: () => set({ transitioning: true }),
    setSessionBoards: (boards) => set({ sessionBoards: boards }),
    setUpcomingBoards: (boards) => set({ upcomingBoards: boards }),
    reset: () => set({ transitioning: false }),
}))

export default useIntro
