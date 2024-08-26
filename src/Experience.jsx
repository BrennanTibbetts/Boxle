import { PresentationControls, useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { Perf } from 'r3f-perf'

import Lights from './Lights.jsx'
import Game from './Game.jsx'

export default function Experience()
{

    const props = useControls({
        background: '#151517',
        performance: true,
    })

    return <>

        <color args={[props.background]} attach={'background'}/>
        {props.performance && <Perf
           position={'top-left'}   
        />}

        <Lights />
        <PresentationControls
            global
            polar={[-1, 0]}
            config={{mass: 2, tension:400}}
            cursor={true}
        >
            <Game/>
        </PresentationControls>
    </>
}