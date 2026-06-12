import { useControls, button } from 'leva'
import { Perf } from 'r3f-perf'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

import Lights from './Lights'
import Game from './Game'
import CameraClip from './CameraClip'
import BoxControls from './components/BoxControls'
import GsapInvalidator from './utils/GsapInvalidator'
import usePersistence from './stores/usePersistence'
import { LIBRARY_MAX_SIZE } from './stores/useLibraryRun'
import { setDevUnlockAll } from './utils/gates'

export default function Experience() {
    const props = useControls('Experience', {
        background: '#151517',
        performance: false,
        clearStorage: button(() => {
            localStorage.clear()
            window.location.reload()
        }),
    })

    // Dev-only: unlock every Library tier (progression) and force the premium
    // gate open (canPlayAt) so the whole paid ladder is playable without a
    // purchase. Lives here (always mounted) rather than in the Library picker
    // so the folder is visible from anywhere. The Leva panel is hidden outside
    // dev, and setDevUnlockAll is a no-op in production builds, so this can't
    // unlock paid content for real users.
    useControls('Library (dev)', {
        'Unlock + play all': button(() => {
            setDevUnlockAll(true)
            usePersistence.getState().unlockLibrarySize(LIBRARY_MAX_SIZE)
        }),
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
        <GsapInvalidator />
        {props.performance && <Perf position='top-left' />}
        <Lights />
        <CameraClip />
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
