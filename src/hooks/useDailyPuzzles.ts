import { useEffect } from 'react'
import type { RawPuzzle } from '../types/puzzle'
import { getDateSeed, seededRandom, decodeBoard } from '../utils/puzzle'
import useGame from '../stores/useGame'

export function useDailyPuzzles(puzzleData: RawPuzzle[][]): void {
    const populatePuzzles = useGame((state) => state.populatePuzzles)

    useEffect(() => {
        const random = seededRandom(getDateSeed())
        const configs = puzzleData.map((puzzles) => {
            const puzzle = puzzles[Math.floor(random() * puzzles.length)]
            return decodeBoard(puzzle.Board)
        })
        populatePuzzles(configs)
    }, [populatePuzzles])
}
