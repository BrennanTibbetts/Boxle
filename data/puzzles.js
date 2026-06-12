// Size 4 (valid_puzzles_4.json) is deliberately not imported: MIN_PUZZLE_SIZE
// is 5, so useDailyPuzzles would filter it out at runtime anyway — importing
// it only bloated the bundle. Re-add the import if MIN ever drops to 4.
import puzzles5 from './valid_puzzles_5.json'
import puzzles6 from './valid_puzzles_6.json'
import puzzles7 from './valid_puzzles_7.json'
import puzzles8 from './valid_puzzles_8.json'
import puzzles9 from './valid_puzzles_9.json'

const boards = [
    puzzles5,
    puzzles6,
    puzzles7,
    puzzles8,
    puzzles9,
]

export default boards
