import { useEffect, useRef, useMemo, memo, useState } from "react"
import Box from "./Box"
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { useControls } from 'leva'
import { useGLTF } from '@react-three/drei'
import ExplosionConfetti from './components/Confetti'

// const levelMatrix = [
//     [0, 0, 2, 3, 3],
//     [0, 2, 2, 3, 3],
//     [1, 2, 2, 4, 3],
//     [1, 2, 2, 4, 3],
//     [1, 2, 4, 4, 3],
// ]

// const levelMatrix = [
//     [0, 0, 0, 0, 3, 3, 3, 3],
//     [0, 0, 0, 3, 3, 2, 2, 3],
//     [0, 0, 3, 3, 2, 2, 4, 4],
//     [0, 0, 0, 2, 2, 2, 4, 4],
//     [6, 0, 2, 2, 2, 1, 1, 4],
//     [6, 6, 6, 1, 1, 1, 1, 4],
//     [6, 6, 6, 6, 1, 1, 7, 5],
//     [6, 6, 6, 6, 7, 7, 7, 5],
// ]

// const levelMatrix = [[4, 4, 4, 4, 4, 1],
//  [4, 4, 4, 4, 1, 1],
//  [5, 3, 3, 1, 1, 1],
//  [5, 3, 1, 1, 1, 1],
//  [0, 3, 0, 2, 2, 2],
//  [0, 0, 0, 2, 2, 2],]

const Level = memo(({levelMatrix, answerMatrix, position, openNextLevel}) => {

    const [isExploding, setIsExploding] = useState(false)

    const starGeometry = useGLTF('/models/star.gltf').nodes.star.geometry

    const size = levelMatrix.length

    const props = useControls('Level', {
        boxSegments: {
            value: 3,
            min: 1,
            max: 10,
            step: 1
        },
        boxRadius: {
            value: 0.1,
            min: 0.0,
            max: 0.5,
            step: 0.01
        },
        spacing: {
            value: 1.1,
            min: 1,
            max: 2,
            step: 0.01
        },
        boxWireframe: false
    })

    const boxGeometry = new RoundedBoxGeometry(1, 1, 1, props.boxSegments, props.boxRadius)
    const markMaterial = new THREE.MeshStandardMaterial({color: '#272729'})

    const confetti = useRef()

    const materialCache = {}
    const currentDate = new Date()
    const day = currentDate.getDate()
    const materialOffset = (day) % 10
    let starsPlaced = 0

    const getMaterial = (groupNumber) => {

        const colors = [
            'mediumpurple',
            'lightcoral',
            'lightblue',
            'lightgreen',
            'lightseagreen',
            'lightyellow',
            'lime',
            'gold',
            'palevioletred'
        ]

        const index = (groupNumber + materialOffset) % colors.length
        const color = colors[index]

        if (!materialCache[color]) {
            materialCache[color] = new THREE.MeshStandardMaterial({color, wireframe: props.boxWireframe})
        }

        return materialCache[color]
    }


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
        openNextLevel()
    }
    

    return <group
        position={position}
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
                    props.spacing,
                ]}
                group={groupNumber}
                geometry={boxGeometry}
                material={getMaterial(groupNumber)}
                markMaterial={markMaterial}
                starGeometry={starGeometry}
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