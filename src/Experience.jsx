import { PresentationControls, Text } from '@react-three/drei'
import Lights from './Lights.jsx'
import Level from "./Level.jsx"
import { useControls } from 'leva'
import { Perf } from 'r3f-perf'
import Instructions from './Instructions.jsx'
import puzzles6 from '../data/valid_puzzles_7.json'
import { useRef } from 'react'
import ExplosionConfetti from './components/Confetti.jsx'

export default function Experience()
{

    const board = puzzles6[Math.floor(Math.random() * puzzles6.length)]

    const props = useControls('experience', {
        background : {
            value: '#151517'
        },
        performance: false
    })

    const groupRef = useRef()

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
            <ExplosionConfetti
                rate={2}
                amount={20} 
                fallingHeight={9} 
                enableShadows 
                isExploding={false} 
                colors={['yellow', 'white', 'red']}
                areaHeight={3}
                areaWidth={5}
            />
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
                <Level levelMatrix={board['Board']}/>
                <Instructions />
            </group>
        </PresentationControls>
    </>
}