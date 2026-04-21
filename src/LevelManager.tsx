import puzzleDataRaw from '../data/puzzles.js'
import type { RawPuzzle } from './types/puzzle'
import Level from './components/Level'
import { useDailyPuzzles } from './hooks/useDailyPuzzles'
import { useLevelFade } from './hooks/useLevelFade'
import useGame from './stores/useGame'

const puzzleData = puzzleDataRaw as unknown as RawPuzzle[][]

export default function LevelManager() {
    useDailyPuzzles(puzzleData)

    const currentLevel = useGame((state) => state.currentLevel)
    const configs = useGame((state) => state.levelConfigs)
    const fadingLevels = useLevelFade()

    if (!configs.length) return null

    const visibleIndices: number[] = []
    if (currentLevel > 1) visibleIndices.push(currentLevel - 2)
    visibleIndices.push(currentLevel - 1)
    if (currentLevel < configs.length) visibleIndices.push(currentLevel)

    return <>
        {fadingLevels.map(({ index, config }) => (
            <Level
                key={`fading-${index}`}
                levelIndex={index}
                levelMatrix={config.levelMatrix}
                answerMatrix={config.answerMatrix}
                interactive={false}
            />
        ))}
        {visibleIndices.map((index) => {
            const config = configs[index]
            if (!config) return null
            return (
                <Level
                    key={index}
                    levelIndex={index}
                    levelMatrix={config.levelMatrix}
                    answerMatrix={config.answerMatrix}
                    interactive={index === currentLevel - 1}
                />
            )
        })}
    </>
}
