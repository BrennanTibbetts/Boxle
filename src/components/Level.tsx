import { memo } from 'react'
import { useControls } from 'leva'

import Box from './Box'

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
        </group>
    )
})

export default Level
