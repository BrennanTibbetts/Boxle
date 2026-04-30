import { useControls } from 'leva'
import { useRef } from 'react'
import { useHelper } from '@react-three/drei'
import type { RefObject } from 'react'
import { DirectionalLightHelper, DirectionalLight, Object3D } from 'three'

const initialIsMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
const defaultShadowMapSize: [number, number] = initialIsMobile ? [512, 512] : [1024, 1024]

export default function Lights() {
    const dl = useControls('directionalLight', {
        helper: false,
        position: { value: [2, 9.2, 2] as [number, number, number], step: 0.1 },
        intensity: { value: 2, min: 0, max: 10, step: 0.1 },
        shadowMapSize: { value: defaultShadowMapSize, step: 1 },
        shadowCameraNear: { value: 1, step: 0.1 },
        shadowCameraFar: { value: 24, step: 0.1 },
        shadowCameraTop: { value: 10, step: 0.1 },
        shadowCameraRight: { value: 10, step: 0.1 },
        shadowCameraBottom: { value: -10, step: 0.1 },
        shadowCameraLeft: { value: -10, step: 0.1 },
        castShadow: true,
    })

    const al = useControls('ambientLight', {
        intensity: { value: 0.4, min: 0, max: 10, step: 0.1 },
    })

    const lightRef = useRef<DirectionalLight>(null)
    useHelper(dl.helper && (lightRef as RefObject<Object3D>), DirectionalLightHelper)

    return <>
        <directionalLight
            ref={lightRef}
            castShadow={dl.castShadow}
            position={dl.position}
            intensity={dl.intensity}
            shadow-mapSize={dl.shadowMapSize}
            shadow-camera-near={dl.shadowCameraNear}
            shadow-camera-far={dl.shadowCameraFar}
            shadow-camera-top={dl.shadowCameraTop}
            shadow-camera-right={dl.shadowCameraRight}
            shadow-camera-bottom={dl.shadowCameraBottom}
            shadow-camera-left={dl.shadowCameraLeft}
        />
        <ambientLight intensity={al.intensity} />
    </>
}
