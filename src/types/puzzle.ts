export type RawCell = number | string

export type RawBoard = RawCell[][]

export interface RawPuzzle {
    Board: RawBoard
}

export interface DecodedBoard {
    levelMatrix: number[][]
    answerMatrix: boolean[][]
}
