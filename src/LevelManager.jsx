import puzzleData from '../data/puzzles.js'
import Level from "./components/Level.jsx"
import useGame from './stores/useGame.js'
import { useEffect, useState, useRef } from 'react'

export default function LevelManager() {
    const [level, setLevel] = useState(1)
    const [boards, setBoards] = useState([])
    const [fadingLevels, setFadingLevels] = useState([])
    const previousLevel = useRef(null)
    
    // Separate useEffect for board initialization
    useEffect(() => {
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
        const generatedBoards = puzzleData.map(puzzles => 
            puzzles[Math.floor(random() * puzzles.length)]
        );
        setBoards(generatedBoards);
    }, []) // Run once on mount

    // Separate useEffect for level subscription
    useEffect(() => {
        const unsubscribeLevel = useGame.subscribe(
            (state) => state.level,
            (value) => {
                console.log('Previous level:', previousLevel.current, 'New level:', value, 'Boards length:', boards.length)
                if (previousLevel.current !== null && value > previousLevel.current && boards.length > 0) {
                    const fadingLevel = previousLevel.current - 1;
                    const fadingBoard = boards[fadingLevel - 1];

                    if (fadingLevel >= 1 && fadingBoard) {
                        const timeoutId = setTimeout(() => {
                            setFadingLevels(current => 
                                current.filter(item => item.index !== fadingLevel)
                            )
                        }, 1000);

                        setFadingLevels(prev => [...prev, {
                            index: fadingLevel,
                            board: fadingBoard,
                            timeoutId
                        }])
                    }
                }
                setLevel(value)
                previousLevel.current = value
            }
        )

        return () => {
            unsubscribeLevel();
            fadingLevels.forEach(item => clearTimeout(item.timeoutId));
        }
    }, [boards]) // Add boards as dependency

    const getVisibleLevels = () => {
        if (!boards.length || level === undefined) return [];
        
        const visibleLevels = [];
        // Previous level (if exists)
        if (level > 1) {
            visibleLevels.push({
                index: level - 1,
                board: boards[level - 2]
            });
        }
        // Current level
        visibleLevels.push({
            index: level,
            board: boards[level - 1]
        });
        // Next level (if exists)
        if (level < boards.length) {
            visibleLevels.push({
                index: level + 1,
                board: boards[level]
            });
        }
        return visibleLevels;
    };

    return (
        <>
            {fadingLevels.map(({ index, board }) => (
                <Level
                    key={`fading-${index}`}
                    index={index-1}
                    levelMatrix={board['Board']}
                    answerMatrix={board['Solution']}
                    isFading={true}
                />
            ))}
            {/* Render current visible levels */}
            {getVisibleLevels().map(({ index, board }) => (
                <Level
                    key={index}
                    index={index-1}
                    levelMatrix={board['Board']}
                    answerMatrix={board['Solution']}
                />
            ))}
        </>
    );
}