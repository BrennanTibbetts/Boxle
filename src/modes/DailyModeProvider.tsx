import puzzleDataRaw from '../../data/puzzles.js'
import type { RawPuzzle } from '../types/puzzle'
import { useDailyPuzzles } from '../hooks/useDailyPuzzles'
import { usePersistenceSync } from '../hooks/usePersistenceSync'

const puzzleData = puzzleDataRaw as unknown as RawPuzzle[][]

export function DailyModeProvider() {
    useDailyPuzzles(puzzleData)
    usePersistenceSync()
    return null
}
