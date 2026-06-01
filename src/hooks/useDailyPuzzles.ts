import { useEffect } from 'react'
import type { RawPuzzle } from '../types/puzzle'
import { getDateSeed, seededRandom, decodeBoard } from '../utils/puzzle'
import useGame from '../stores/useGame'
import useIntro from '../stores/useIntro'
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
        // Daily loads every puzzle into levelConfigs up front, so the intro
        // ladder and the play window both read those directly — clear any
        // lookahead a prior Library/Infinite session left behind so it doesn't
        // bleed through.
        useIntro.getState().setSessionBoards([])
        useIntro.getState().setUpcomingBoards([])
        populatePuzzles(configs)
    }, [populatePuzzles])
}
