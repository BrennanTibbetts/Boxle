import { useControls } from 'leva'
import { Perf } from 'r3f-perf'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

import Lights from './Lights'
import Game from './Game'
import BoxControls from './components/BoxControls'

export default function Experience() {
    const props = useControls('Experience', {
        background: '#151517',
        performance: false,
    })

    const bloom = useControls('Bloom', {
        usePostBloom: { value: false, label: 'Post-process Bloom' },
        intensity: { value: 2.5, min: 0, max: 10, step: 0.1 },
        luminanceThreshold: { value: 0.6, min: 0, max: 2, step: 0.01 },
        luminanceSmoothing: { value: 0.4, min: 0, max: 1, step: 0.01 },
        radius: { value: 0.8, min: 0, max: 1, step: 0.01 },
    })

    return <>
        <color args={[props.background]} attach='background' />
        {props.performance && <Perf position='top-left' />}
        <Lights />
        <BoxControls />
        <Game />
        {bloom.usePostBloom && (
            <EffectComposer>
                <Bloom
                    intensity={bloom.intensity}
                    luminanceThreshold={bloom.luminanceThreshold}
                    luminanceSmoothing={bloom.luminanceSmoothing}
                    radius={bloom.radius}
                />
            </EffectComposer>
        )}
    </>
}
