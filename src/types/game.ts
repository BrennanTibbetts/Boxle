export const Phase = {
    READY: 'ready',
    PLAYING: 'playing',
    ENDED: 'ended',
} as const

export type PhaseValue = typeof Phase[keyof typeof Phase]

export const GameMode = {
    MENU: 'menu',
    DAILY: 'daily',
    INFINITE: 'infinite',
    LIBRARY: 'library',
} as const

export type GameModeValue = typeof GameMode[keyof typeof GameMode]

// The modes that record stats/saves — everything except the menu. Derived
// from GameMode so adding a mode can't leave a stale hand-written union.
export type TrackedMode = Exclude<GameModeValue, typeof GameMode.MENU>

export const BoxState = {
    BLANK: 'blank',
    LOCK: 'lock',
    MARK: 'mark',
    BOXLE: 'boxle',
} as const

export type BoxStateValue = typeof BoxState[keyof typeof BoxState]

export type LevelGrid = BoxStateValue[][]
