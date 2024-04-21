import { PresentationControls, Text, useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { Perf } from 'r3f-perf'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import * as THREE from 'three'
import { useState, useRef } from 'react'
import gsap from 'gsap'

import Level from "./Level.jsx"
import Instructions from './Instructions.jsx'
import Lights from './Lights.jsx'
import puzzles5 from '../data/valid_puzzles_5.json'
import puzzles6 from '../data/valid_puzzles_6.json'
import puzzles7 from '../data/valid_puzzles_7.json'
import puzzles8 from '../data/valid_puzzles_8.json'
import puzzles9 from '../data/valid_puzzles_9.json'

export default function Experience()
{

    const board5 = puzzles5[Math.floor(Math.random() * puzzles5.length)]
    const board6 = puzzles6[Math.floor(Math.random() * puzzles6.length)]
    const board7 = puzzles7[Math.floor(Math.random() * puzzles7.length)]
    const board8 = puzzles8[Math.floor(Math.random() * puzzles8.length)]
    const board9 = puzzles9[Math.floor(Math.random() * puzzles9.length)]

    const props = useControls('experience', {
        background : {
            value: '#151517'
        },
        performance: false,
        boardSpacing: {
            value: 12,
            min: 10,
            max: 20,
            step: 0.1 
        },
        boxSegments: {
            value: 1,
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

    let materialCache = []
    const currentDate = new Date()
    const day = currentDate.getDate()
    const materialOffset = (day) % 10

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

        if (!materialCache[index]) {
            materialCache[index] = new THREE.MeshStandardMaterial({color, wireframe: props.boxWireframe})
        }

        return materialCache[color]
    }

    const getCacheRef = useRef()
    getCacheRef.current = () => {
        for (let i = 0; i < 9; i++) {
            getMaterial(i)
        }

        return materialCache
    }

    const starGeometry = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/star/model.gltf').nodes.star.geometry
    const boxGeometry = new RoundedBoxGeometry(1, 1, 1, props.boxSegments, props.boxRadius)
    const markMaterial = new THREE.MeshStandardMaterial({color: '#272729'})

    const groupRef = useRef()

    const openNextLevel = () => {   
        
    }


    return <>

        <color args={[props.background]} attach={'background'}/>
        
        {props.performance && <Perf
           position={'top-left'}   
        />}


        <Lights />
        
        <PresentationControls
            global
            polar={[-1, 0]} //vertical limitations
            config={{mass: 2, tension:400}}
            cursor={true}
        >
            <group
                ref={groupRef}
            >
                <Text
                    font='./bebas.woff'
                    position={[0, -0.5, -5]}
                    rotation={[-Math.PI * 0.5, 0, 0]}
                >
                Boxle 
                </Text>
                <Instructions />
                <Level 
                    levelMatrix={board9['Board']} 
                    answerMatrix={board9['Solution']}
                    openNextLevel={openNextLevel}
                    boxGeometry={boxGeometry}
                    starGeometry={starGeometry}
                    markMaterial={markMaterial}
                    materialCache={getCacheRef.current()}
                />
                <Level 
                    levelMatrix={board6['Board']} 
                    answerMatrix={board6['Solution']}
                    position={[0, 0, props.boardSpacing * -1]}
                    openNextLevel={openNextLevel}
                    boxGeometry={boxGeometry}
                    starGeometry={starGeometry}
                    markMaterial={markMaterial}
                    materialCache={materialCache}
                />
                <Level 
                    levelMatrix={board7['Board']} 
                    answerMatrix={board7['Solution']}
                    position={[0, 0, props.boardSpacing * -2]}
                    openNextLevel={openNextLevel}
                    boxGeometry={boxGeometry}
                    starGeometry={starGeometry}
                    markMaterial={markMaterial}
                    materialCache={materialCache}
                />
                <Level 
                    levelMatrix={board8['Board']} 
                    answerMatrix={board8['Solution']}
                    position={[0, 0, props.boardSpacing * -3]}
                    openNextLevel={openNextLevel}
                    boxGeometry={boxGeometry}
                    starGeometry={starGeometry}
                    markMaterial={markMaterial}
                    materialCache={materialCache}
                />
                <Level 
                    levelMatrix={board9['Board']} 
                    answerMatrix={board9['Solution']}
                    position={[0, 0, props.boardSpacing * -4]}
                    openNextLevel={openNextLevel}
                    boxGeometry={boxGeometry}
                    starGeometry={starGeometry}
                    markMaterial={markMaterial}
                    materialCache={materialCache}
                />
                <Instructions />
            </group>
        </PresentationControls>
    </>
}