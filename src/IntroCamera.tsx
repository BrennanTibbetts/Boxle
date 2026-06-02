import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { useControls, folder } from 'leva'
import * as THREE from 'three'
import type { PerspectiveCamera } from 'three'

import useGame from './stores/useGame'
import useIntro from './stores/useIntro'
import { requiredCameraY, PLAY_BASE_HEIGHT } from './CameraManager'

// Board-intro camera. Mounted in place of CameraManager during Phase.READY
// (see Game.tsx) so the two never fight over the single camera.
//
// Two states, both driven here:
//   - Hold: anchor on board 1 (which sits at z = 0) and look *forward* down the
//     ladder — a low-angle hero shot of the first board with the rest receding
//     behind it. Both how far we look (`lookForward`) and how far back the
//     camera sits (a fixed proportion of `lookForward`) are size-independent,
//     so the framing is identical regardless of board size or how many trail.
//   - Fly-in: on Start (useIntro.transitioning) lerp position to straight above
//     board 1 and slerp orientation to the exact top-down play pose, then flip
//     the game to PLAYING. Quaternion slerp (vs lookAt-per-frame) avoids the
//     roll snap as the view crosses vertical, and lands on the identical pose
//     CameraManager inherits — no jump at the handoff.
export default function IntroCamera() {
    const camera = useThree((s) => s.camera)
    const viewport = useThree((s) => s.size)

    const knobs = useControls('Board Intro', {
        camera: folder({
            pitch: { value: 19, min: 5, max: 89, step: 1 },
            yaw: { value: 0, min: -90, max: 90, step: 1 },
            distanceMul: { value: 0.6, min: 0.2, max: 3, step: 0.05, label: 'distance ×forward' },
            targetY: { value: 0.75, min: -10, max: 10, step: 0.25 },
            lookForward: { value: 20, min: 0, max: 60, step: 1, label: 'look forward' },
            flyDuration: { value: 2.4, min: 0.2, max: 4, step: 0.1 },
        }),
    })

    const flyingRef = useRef(false)
    const progressRef = useRef(0)
    const startPos = useRef(new THREE.Vector3())
    const startQuat = useRef(new THREE.Quaternion())
    const endPos = useRef(new THREE.Vector3())
    // A probe camera used only to read the exact straight-down orientation the
    // play camera uses, so the slerp target matches CameraManager precisely.
    const probe = useRef(new THREE.PerspectiveCamera())

    // If we unmount mid-intro (mode switch, etc.), clear the flag so the next
    // session's Start button isn't stuck mid-transition.
    useEffect(() => () => useIntro.getState().reset(), [])

    useFrame((_, dt) => {
        const game = useGame.getState()
        // Library/Infinite publish their pre-generated lookahead here; Daily
        // leaves it empty so we fall back to the fully-loaded levelConfigs. We
        // only need the first board — that's what we frame and look forward from.
        const previewed = useIntro.getState().sessionBoards
        const configs = previewed.length ? previewed : game.levelConfigs
        const firstN = configs[0]?.levelMatrix.length ?? 5

        const aspect = viewport.width / Math.max(1, viewport.height)
        const fov = (camera as PerspectiveCamera).fov

        if (!useIntro.getState().transitioning) {
            // Hero hold — anchor on board 1 (z = 0) and look forward down the
            // ladder. Distance is tied to how far we look forward (a fixed
            // proportion of `lookForward`), not to board size or count, so the
            // framing stays consistent across every mode and board size.
            const pitch = THREE.MathUtils.degToRad(knobs.pitch)
            const yaw = THREE.MathUtils.degToRad(knobs.yaw)
            const d = knobs.lookForward * knobs.distanceMul
            camera.position.set(
                d * Math.cos(pitch) * Math.sin(yaw),
                knobs.targetY + d * Math.sin(pitch),
                d * Math.cos(pitch) * Math.cos(yaw) // +z: in front of board 1, looking toward -z
            )
            // Look *forward* down the ladder (boards recede toward -z), not at
            // board 1 itself — a low hero angle with the rest of the ladder
            // trailing behind the first board.
            camera.lookAt(0, knobs.targetY, -knobs.lookForward)
            flyingRef.current = false
            progressRef.current = 0
            return
        }

        // Fly-in to the top-down play pose of board 1 (z = 0).
        if (!flyingRef.current) {
            flyingRef.current = true
            progressRef.current = 0
            startPos.current.copy(camera.position)
            startQuat.current.copy(camera.quaternion)
        }
        progressRef.current = Math.min(1, progressRef.current + dt / Math.max(0.0001, knobs.flyDuration))
        const p = progressRef.current
        const e = p * p * (3 - 2 * p) // smoothstep

        const endY = Math.max(PLAY_BASE_HEIGHT, requiredCameraY(firstN, aspect, fov))
        endPos.current.set(0, endY, 0)

        probe.current.position.set(0, endY, 0)
        probe.current.up.set(0, 1, 0)
        probe.current.lookAt(0, 0, 0)

        camera.position.lerpVectors(startPos.current, endPos.current, e)
        camera.quaternion.slerpQuaternions(startQuat.current, probe.current.quaternion, e)

        if (p >= 1) {
            // Hands off to CameraManager (mounts on PLAYING) at the identical pose.
            useGame.getState().start()
            useIntro.getState().reset()
        }
    })

    return null
}
