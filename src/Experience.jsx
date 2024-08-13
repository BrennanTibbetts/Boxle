import { PresentationControls, useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { Perf } from 'r3f-perf'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import * as THREE from 'three'
import { useRef } from 'react'
import gsap from 'gsap'

import Lights from './Lights.jsx'
import Game from './Game.jsx'

export default function Experience()
{

    return <>

        {/* <color args={[props.background]} attach={'background'}/> */}
        
        {/* {props.performance && <Perf
           position={'top-left'}   
        />} */}


        <Lights />
        
        <PresentationControls
            global
            polar={[-1, 0]} //vertical limitations
            config={{mass: 2, tension:400}}
            cursor={true}
        >
           >
                <Game/>
        </PresentationControls>
    </>
}