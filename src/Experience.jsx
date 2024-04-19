import { PresentationControls, Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import Lights from './Lights.jsx'
import Level from "./Level.jsx"
import { useControls } from 'leva'
import { Perf } from 'r3f-perf'
import Instructions from './Instructions.jsx'
import puzzles5 from '../data/valid_puzzles_5.json'
import puzzles6 from '../data/valid_puzzles_6.json'
import puzzles7 from '../data/valid_puzzles_7.json'
import puzzles8 from '../data/valid_puzzles_8.json'
import puzzles9 from '../data/valid_puzzles_9.json'

import { useRef } from 'react'

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
        performance: false
    })

    const groupRef = useRef()

    const openNextLevel = () => {   
        groupRef.current.position.z += 12
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
                    levelMatrix={board5['Board']} 
                    answerMatrix={board5['Solution']}
                    openNextLevel={openNextLevel}
                />
                <Level 
                    levelMatrix={board6['Board']} 
                    answerMatrix={board6['Solution']}
                    position={[0, 0, -12]}
                    openNextLevel={openNextLevel}
                />
                <Level 
                    levelMatrix={board7['Board']} 
                    answerMatrix={board7['Solution']}
                    position={[0, 0, -24]}
                    openNextLevel={openNextLevel}
                />
                <Level 
                    levelMatrix={board8['Board']} 
                    answerMatrix={board8['Solution']}
                    position={[0, 0, -36]}
                    openNextLevel={openNextLevel}
                />
                <Level 
                    levelMatrix={board9['Board']} 
                    answerMatrix={board9['Solution']}
                    position={[0, 0, -48]}
                    openNextLevel={openNextLevel}
                />
                <Instructions />
            </group>
        </PresentationControls>
    </>
}