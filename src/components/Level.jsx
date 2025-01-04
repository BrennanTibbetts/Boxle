import { useEffect, useRef, useMemo, memo, useState } from "react"
import Box from "./Box"
import { useControls } from 'leva'
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

    const boxes = useMemo(()=>{

        const boxes = []

        for (let r = 0; r < levelMatrix.length; r++){
            for (let c = 0; c < levelMatrix[r].length; c++){
                boxes.push(Box)
            }
        }

        return boxes

    }, [size])

    const boxRefs = useRef([])

    useEffect(() => {
        boxRefs.current = boxRefs.current.slice(0, levelMatrix.length * levelMatrix[0].length);
    }, [levelMatrix])

    const handleCascadeRef = useRef()

    handleCascadeRef.current = (starGroup, starRow, starColumn) => {
        if (!answerMatrix[starRow][starColumn]) {
            boxRefs.current[starRow * size + starColumn].current.declineStar()
            return
        }
        starsPlaced += 1

        if(starsPlaced == levelMatrix.length)
            triggerWin()

        // loop rows
        const n = levelMatrix.length
        for (let r = 0; r < n; r++){
            // loop columns
            for (let c = 0; c < n; c++){
                // get the group number of the current box
                const groupNumber = levelMatrix[r][c] 

                if(r === starRow && c === starColumn)
                    boxRefs.current[starRow * size + starColumn].current.acceptStar()
                else if(groupNumber === starGroup)
                    boxRefs.current[r * n + c].current.groupCascade()
                else if(r === starRow)
                    boxRefs.current[r * n + c].current.rowCascade(starColumn)
                else if(c === starColumn)
                    boxRefs.current[r * n + c].current.columnCascade(starRow)
                else if (Math.abs(r - starRow) === Math.abs(c - starColumn) && 
                Math.min(Math.abs(r - starRow), Math.abs(c - starColumn)) === 1) {
                    boxRefs.current[r * n + c].current.cornerCascade();
                }
            }
        }
    }

    const triggerWin = () => {
        setIsExploding(true)
        incrementLevel()
    }

    return <group
        position={[0, 0, props.boardSpacing * -index]}
    >
        {boxes.map((Box, index)=>{

            const row = Math.floor(index / size)
            const column = index % size
            const groupNumber = levelMatrix[row][column]

            return <Box
                key={index}
                ref={boxRefs.current[index] = useRef()}
                placement={[
                    row,
                    column,
                    size,
                    props.boxSpacing,
                ]}
                group={groupNumber}
                placeStar={() => handleCascadeRef.current(groupNumber, row, column)}
            />
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
})

export default Level