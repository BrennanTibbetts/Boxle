import { PresentationControls } from '@react-three/drei'
import { useControls } from 'leva'
import { Perf } from 'r3f-perf'

import Lights from './Lights.jsx'
import Game from './Game.jsx'

export default function Experience()
{

    const props = useControls("Experience", {
        background: '#151517',
        performance: true,
        polarCoordinates: [-0.5, 0.1]
    })

    return <>
        <color args={[props.background]} attach={'background'}/>
        {props.performance && <Perf
           position={'top-left'}   
        />}

        <Lights />
        <Game/>
    </>
}