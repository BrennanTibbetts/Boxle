import { PresentationControls, Text } from '@react-three/drei'
import Lights from './Lights.jsx'
import Level from "./Level.jsx"
import { useControls } from 'leva'
import { Perf } from 'r3f-perf'
import Instructions from './Instructions.jsx'
import puzzles6 from '../data/valid_puzzles_8.json'
import { useRef, useState } from 'react'
import gsap from 'gsap'

export default function Experience()
{

    const board = puzzles6[Math.floor(Math.random() * puzzles6.length)]

    const [focusedInstructions, setFocusedInstructions] = useState(false)

    const props = useControls('experience', {
        background : {
            value: '#151517'
        },
        performance: false
    })

    const focusInstructions = (e) => {

        e.stopPropagation()
        if(focusedInstructions) {
            gsap.to(groupRef.current.position, {
                z: 0,
                duration: 0.5
            })
            setFocusedInstructions(false)
            return
        }

        if (!focusedInstructions) {
            gsap.to(groupRef.current.position, {
                z: -10,
                duration: 0.5
            })
            setFocusedInstructions(true)
            return
        }
    }

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
                <Instructions focusInstructions={focusInstructions} />
            </group>
        </PresentationControls>
    </>
}