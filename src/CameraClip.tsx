import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useControls, folder } from 'leva'
import type { PerspectiveCamera } from 'three'

// Controls how far the camera can see — the far clip plane. Anything past it is
// culled, so it's the hard ceiling on the visible ladder depth: a deep intro
// stack (Board Intro → intro boards) only renders fully if `far` reaches it.
// The Canvas seeds the same far (260); this lets it be tuned live without editing index.tsx.
//
// Lives in its own always-mounted component (not IntroCamera, which only mounts
// during the intro) so the setting applies in play too, and survives the
// IntroCamera↔CameraManager handoff. Writing camera.far requires a follow-up
// updateProjectionMatrix() to take effect.
export default function CameraClip() {
    const camera = useThree((s) => s.camera) as PerspectiveCamera

    const { far } = useControls('Board Intro', {
        clip: folder({
            far: { value: 260, min: 20, max: 500, step: 5, label: 'view distance' },
        }),
    })

    useEffect(() => {
        camera.far = far
        camera.updateProjectionMatrix()
    }, [camera, far])

    return null
}
