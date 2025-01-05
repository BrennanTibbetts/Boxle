import { useRef, useMemo, memo, useState } from "react"
import { useControls } from 'leva'

import Box from "./Box"
import ExplosionConfetti from './Confetti'
import useGame from "../stores/useGame"

const Level = memo(({index, levelMatrix, answerMatrix}) => {
    const [isExploding, setIsExploding] = useState(false)
    const incrementLevel = useGame((state) => state.incrementLevel)
    const size = levelMatrix.length
    const props = useControls('Level', {
        boxSpacing: {
            value: 1.1,
            min: 1,
            max: 2,
            step: 0.01
        },  
        boardSpacing: {
            value: 12,
            min: 10,
            max: 20,
            step: 0.1
        }
    })
    
    let starsPlaced = 0
    const boxRefs = useRef(Array(levelMatrix.length * levelMatrix[0].length).fill(null))

    const boxes = useMemo(() => {
        return Array(levelMatrix.length * levelMatrix[0].length).fill(Box)
    }, [levelMatrix])

    const handleCascadeRef = useRef()
    handleCascadeRef.current = (starGroup, starRow, starColumn) => {
        if (!answerMatrix[starRow][starColumn]) {
            boxRefs.current[starRow * size + starColumn].declineStar()
            return
        }
        starsPlaced += 1
        if(starsPlaced == levelMatrix.length)
            triggerWin()
        
        const n = levelMatrix.length
        for (let r = 0; r < n; r++){
            for (let c = 0; c < n; c++){
                const groupNumber = levelMatrix[r][c] 
                const currentRef = boxRefs.current[r * n + c]
                
                if(r === starRow && c === starColumn)
                    currentRef.acceptStar()
                else if(groupNumber === starGroup)
                    currentRef.groupCascade()
                else if(r === starRow)
                    currentRef.rowCascade(starColumn)
                else if(c === starColumn)
                    currentRef.columnCascade(starRow)
                else if (Math.abs(r - starRow) === Math.abs(c - starColumn) && 
                Math.min(Math.abs(r - starRow), Math.abs(c - starColumn)) === 1) {
                    currentRef.cornerCascade()
                }
            }
        }
    }

    const triggerWin = () => {
        setIsExploding(true)
        incrementLevel()
    }

    const setBoxRef = (index, ref) => {
        boxRefs.current[index] = ref
    }

    return (
        <group position={[0, 0, props.boardSpacing * -index]}>
            {boxes.map((Box, index) => {
                const row = Math.floor(index / size)
                const column = index % size
                const groupNumber = levelMatrix[row][column]
                return (
                    <Box
                        key={index}
                        ref={(ref) => setBoxRef(index, ref)}
                        placement={[
                            row,
                            column,
                            size,
                            props.boxSpacing,
                        ]}
                        group={groupNumber}
                        placeStar={() => handleCascadeRef.current(groupNumber, row, column)}
                    />
                )
            })}
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