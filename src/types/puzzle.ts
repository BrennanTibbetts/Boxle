export type RawBox = number | string

export type RawBoard = RawBox[][]

export interface RawPuzzle {
    Board: RawBoard
}

export interface DecodedBoard {
    levelMatrix: number[][]
    answerMatrix: boolean[][]
}
