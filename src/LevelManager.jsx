import { useControls } from "leva"

import puzzles5 from '../data/valid_puzzles_5.json'
import puzzles6 from '../data/valid_puzzles_6.json'
import puzzles7 from '../data/valid_puzzles_7.json'
import puzzles8 from '../data/valid_puzzles_8.json'
import puzzles9 from '../data/valid_puzzles_9.json'
import Level from "./components/Level.jsx"

export default function LevelManager() {

    const getDateAsInteger = () => {
        const date = new Date();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return parseInt(`${month}${day}${year}`, 10);
    };

    function seededRandom(seed) {
        let value = seed % 2147483647;
        if (value <= 0) value += 2147483646;
        return () => {
            value = (value * 16807) % 2147483647;
            return (value - 1) / 2147483646;
        };
    }

    const seed = getDateAsInteger();
    const random = seededRandom(seed);

    const puzzleData = [puzzles5, puzzles6, puzzles7, puzzles8, puzzles9];
    const boards = puzzleData.map(puzzles => puzzles[Math.floor(Math.random() * puzzles.length)]);

    return <>
        {boards.map((board, index) => (
            <Level
                key={index}
                index={index}
                levelMatrix={board['Board']}
                answerMatrix={board['Solution']}
            />
        ))}
    </>
}