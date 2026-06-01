import { memo } from 'react'

import Box from './Box'

interface LevelProps {
    levelIndex: number
    levelMatrix: number[][]
    answerMatrix: boolean[][]
    interactive?: boolean
    isFading?: boolean
    // World-Z of this board in the ladder + per-box spacing, both computed by
    // LevelManager from the shared board-layout controls so every board and
    // the camera agree on positions (see hooks/useBoardLayout).
    z: number
    boxSpacing: number
}

const Level = memo(({ levelIndex, levelMatrix, interactive = true, z, boxSpacing }: LevelProps) => {
    const size = levelMatrix.length

    return (
        <group position={[0, 0, z]}>
            {levelMatrix.map((row, r) =>
                row.map((group, c) => (
                    <Box
                        key={`${r}-${c}`}
                        group={group}
                        levelIndex={levelIndex}
                        row={r}
                        col={c}
                        gridSize={size}
                        spacing={boxSpacing}
                        interactive={interactive}
                    />
                ))
            )}
        </group>
    )
})

export default Level
