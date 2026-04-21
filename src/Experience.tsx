import { useControls } from 'leva'
import { Perf } from 'r3f-perf'

import Lights from './Lights'
import Game from './Game'

export default function Experience() {
    const props = useControls('Experience', {
        background: '#151517',
        performance: false,
    })

    return <>
        <color args={[props.background]} attach='background' />
        {props.performance && <Perf position='top-left' />}
        <Lights />
        <Game />
    </>
}
