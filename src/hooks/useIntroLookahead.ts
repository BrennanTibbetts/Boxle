import { useControls, folder } from 'leva'

import { INTRO_LOOKAHEAD } from '../stores/useIntro'

// Leva-backed control for how many boards the board-intro ladder previews.
// Lives under the same **Board Intro** folder the camera uses, so all intro
// tunables sit together. Defaults to INTRO_LOOKAHEAD (the shared fallback).
//
// The mode providers read this at *session bootstrap* (a fresh run / re-entering
// a mode), since that's when the ladder boards are generated — changing it
// mid-run won't regenerate the current ladder, it takes effect on the next
// session entry. The max is deliberately generous: each extra board is one more
// generation before the intro shows, so cranking it up trades a longer pre-intro
// wait for a deeper visible stack.
export function useIntroLookahead(): number {
    const { introBoards } = useControls('Board Intro', {
        ladder: folder({
            introBoards: {
                value: INTRO_LOOKAHEAD,
                min: 1,
                max: 50,
                step: 1,
                label: 'intro boards',
            },
        }),
    })
    return introBoards
}
