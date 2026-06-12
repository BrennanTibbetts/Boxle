// A box in the raw (bundled/served) puzzle encoding: plain `regionId` number
// for an ordinary box, or the string `` `${regionId}*` `` for a solution box.
// decodeBoard relies on this: `typeof box === 'string'` → answerMatrix true,
// and parseInt drops the trailing `*` for levelMatrix. The encoders live in
// src/generator/generate.ts and puzzle-generator/generate.js (parity-locked).
// This schema is the durable artifact shared with the future iOS port.
export type RawBox = number | string

export type RawBoard = RawBox[][]

export interface RawPuzzle {
    Board: RawBoard
}

export interface DecodedBoard {
    levelMatrix: number[][]
    answerMatrix: boolean[][]
}
