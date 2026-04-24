export const Phase = {
    READY: 'ready',
    PLAYING: 'playing',
    ENDED: 'ended',
} as const

export type PhaseValue = typeof Phase[keyof typeof Phase]

export const GameMode = {
    DAILY: 'daily',
    ARCADE: 'arcade',
    LIBRARY: 'library',
} as const

export type GameModeValue = typeof GameMode[keyof typeof GameMode]

export const BoxState = {
    BLANK: 'blank',
    LOCK: 'lock',
    MARK: 'mark',
    BOXLE: 'boxle',
} as const

export type BoxStateValue = typeof BoxState[keyof typeof BoxState]

export type LevelGrid = BoxStateValue[][]
