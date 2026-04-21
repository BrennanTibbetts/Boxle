export const Phase = {
    READY: 'ready',
    PLAYING: 'playing',
    ENDED: 'ended',
} as const

export type PhaseValue = typeof Phase[keyof typeof Phase]

export const BoxState = {
    BLANK: 'blank',
    LOCK: 'lock',
    MARK: 'mark',
    STAR: 'star',
} as const

export type BoxStateValue = typeof BoxState[keyof typeof BoxState]

export type LevelGrid = BoxStateValue[][]
