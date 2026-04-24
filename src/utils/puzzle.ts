import type { RawBoard, DecodedBoard } from '../types/puzzle'

export function getDateSeed(): number {
    const date = new Date()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    return parseInt(`${month}${day}${year}`, 10)
}

export function seededRandom(seed: number): () => number {
    let value = seed % 2147483647
    if (value <= 0) value += 2147483646
    return () => {
        value = (value * 16807) % 2147483647
        return (value - 1) / 2147483646
    }
}

export function decodeBoard(rawBoard: RawBoard): DecodedBoard {
    return {
        levelMatrix: rawBoard.map((row) =>
            row.map((box) => (typeof box === 'string' ? parseInt(box) : box))
        ),
        answerMatrix: rawBoard.map((row) =>
            row.map((box) => typeof box === 'string')
        ),
    }
}
