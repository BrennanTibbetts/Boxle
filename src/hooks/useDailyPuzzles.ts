import { useEffect } from 'react'
import type { RawPuzzle } from '../types/puzzle'
import { getDateSeed, seededRandom, decodeBoard } from '../utils/puzzle'
import useGame from '../stores/useGame'
import { MIN_PUZZLE_SIZE } from '../config/puzzleSize'

export function useDailyPuzzles(puzzleData: RawPuzzle[][]): void {
    const populatePuzzles = useGame((state) => state.populatePuzzles)

    useEffect(() => {
        const random = seededRandom(getDateSeed())
        // Each pool is one size; size = first puzzle's board length. Drop
        // pools smaller than the configured floor so daily honours
        // MIN_PUZZLE_SIZE without touching data/puzzles.js.
        const eligible = puzzleData.filter(
            (pool) => pool.length > 0 && pool[0].Board.length >= MIN_PUZZLE_SIZE
        )
        const configs = eligible.map((puzzles) => {
            const puzzle = puzzles[Math.floor(random() * puzzles.length)]
            return decodeBoard(puzzle.Board)
        })
        populatePuzzles(configs)
    }, [populatePuzzles])
}
