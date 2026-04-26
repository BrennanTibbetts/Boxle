import { memo } from 'react'
import { useControls } from 'leva'

import Box from './Box'
import ExplosionConfetti from './Confetti'
import useGame, { BoxState } from '../stores/useGame'

interface LevelProps {
    levelIndex: number
    levelMatrix: number[][]
    answerMatrix: boolean[][]
    interactive?: boolean
    isFading?: boolean
}

const Level = memo(({ levelIndex, levelMatrix, interactive = true }: LevelProps) => {
    const size = levelMatrix.length

    const props = useControls('Level', {
        boxSpacing: { value: 1, min: 1, max: 2, step: 0.01 },
        boardSpacing: { value: 16, min: 10, max: 24, step: 0.1 },
    })

    const isExploding = useGame((state) => {
        const level = state.levels[levelIndex]
        if (!level) return false
        return level.flat().filter((s) => s === BoxState.BOXLE).length >= size
    })

    return (
        <group position={[0, 0, props.boardSpacing * -levelIndex]}>
            {levelMatrix.map((row, r) =>
                row.map((group, c) => (
                    <Box
                        key={`${r}-${c}`}
                        group={group}
                        levelIndex={levelIndex}
                        row={r}
                        col={c}
                        gridSize={size}
                        spacing={props.boxSpacing}
                        interactive={interactive}
                    />
                ))
            )}
            <ExplosionConfetti
                rate={2}
                amount={20}
                fallingHeight={10}
                enableShadows
                isExploding={isExploding}
                colors={['yellow', 'white', 'red']}
                areaHeight={3}
                areaWidth={5}
            />
        </group>
    )
})

export default Level
