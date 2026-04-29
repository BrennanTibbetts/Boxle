import type { RawBoard, DecodedBoard } from '../types/puzzle'

// UTC-normalized so all players worldwide get the same daily puzzle on the
// same calendar day (UTC). Local-time would fork the daily seed across
// timezones — two players at midnight in different zones would otherwise
// see different puzzles for the same shared day.
export function getDateSeed(): number {
    const date = new Date()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const year = date.getUTCFullYear()
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
