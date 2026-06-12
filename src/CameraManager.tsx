import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import gsap from 'gsap'
import { useControls } from 'leva'
import useGame from './stores/useGame'
import { useBoardLayout, boardZAt, BOX_SPACING } from './hooks/useBoardLayout'

// 15% margin so the board doesn't kiss the edge of the viewport in portrait.
const PORTRAIT_FIT_MARGIN = 1.15

// Base top-down height in landscape. Also the Leva default below; exported so
// the board-intro fly-in lands exactly where CameraManager will take over.
export const PLAY_BASE_HEIGHT = 16

// Camera height needed to fit `gridSize` boxes wide at this aspect, given the
// camera's vertical FOV. Returns the *minimum* y; callers take a max with the
// configured base height so landscape stays unchanged.
export function requiredCameraY(gridSize: number, aspect: number, fovDeg: number): number {
    const fovRad = (fovDeg * Math.PI) / 180
    const tanHalfFov = Math.tan(fovRad / 2)
    return (gridSize * BOX_SPACING * PORTRAIT_FIT_MARGIN) / (2 * tanHalfFov * aspect)
}

export default function CameraManager() {
    const { camera, size } = useThree()

    const props = useControls('Camera', {
        levelHeightIncrease: 0.4,
        cameraHeightY: PLAY_BASE_HEIGHT,
    })
    // Board z-spacing is shared with Level/IntroCamera (and size-aware) — see
    // hooks/useBoardLayout. Read it here so the camera pans to the exact z each
    // board is rendered at.
    const layout = useBoardLayout()

    // Live values read inside subscription callbacks. Subscriptions install
    // once (only `camera` in the dep array) so resize observers can't tear
    // down the listener between a `placeBoxle` set and the level-change
    // tween — that race silently dropped portrait level transitions.
    const aspectRef = useRef(1)
    const cameraHeightYRef = useRef(props.cameraHeightY)
    const levelHeightIncreaseRef = useRef(props.levelHeightIncrease)
    const layoutRef = useRef(layout)

    aspectRef.current = size.width / Math.max(size.height, 1)
    cameraHeightYRef.current = props.cameraHeightY
    levelHeightIncreaseRef.current = props.levelHeightIncrease
    layoutRef.current = layout

    // Z the camera should sit above, for the given 1-based level: the board's
    // own z in the ladder, derived from every board's size up to it.
    const levelZ = (level: number) => {
        const sizes = useGame.getState().levelConfigs.map((c) => c.levelMatrix.length)
        return boardZAt(sizes, level - 1, layoutRef.current)
    }

    // The camera's intended (y, z) destination. Every tween restart reads
    // both axes from here so resize-mid-transition can't strand z partway.
    const targetRef = useRef({ y: 0, z: 0 })
    const posTweenRef = useRef<gsap.core.Tween | null>(null)

    // Height for the given 1-based level: portrait fit (or the configured base
    // height, whichever is larger) plus the per-level climb. Reads only refs
    // and fresh store state, so it's safe inside long-lived subscriptions.
    const computeY = (level: number) => {
        const cam = camera as PerspectiveCamera
        const game = useGame.getState()
        const cfg = game.levelConfigs[level - 1]
        const gridSize = cfg ? cfg.levelMatrix.length : 1
        const fitY = requiredCameraY(gridSize, aspectRef.current, cam.fov)
        return Math.max(cameraHeightYRef.current, fitY) + (level - 1) * levelHeightIncreaseRef.current
    }

    useEffect(() => {
        const tweenToTarget = (duration: number) => {
            posTweenRef.current?.kill()
            posTweenRef.current = gsap.to(camera.position, {
                y: targetRef.current.y,
                z: targetRef.current.z,
                duration,
            })
        }

        const { currentLevel } = useGame.getState()
        targetRef.current.y = computeY(currentLevel)
        targetRef.current.z = levelZ(currentLevel)
        camera.position.y = targetRef.current.y
        camera.position.z = targetRef.current.z

        const unsubscribeLevel = useGame.subscribe(
            (state) => state.currentLevel,
            (value) => {
                targetRef.current.y = computeY(value)
                targetRef.current.z = levelZ(value)
                tweenToTarget(1)
            }
        )

        // levelConfigs flips from [] to populated on first mount of the
        // active mode, and on Infinite puzzle appends. currentLevel often
        // doesn't change in those transitions, so we refit y here.
        const unsubscribeConfigs = useGame.subscribe(
            (state) => state.levelConfigs,
            () => {
                const game = useGame.getState()
                targetRef.current.y = computeY(game.currentLevel)
                tweenToTarget(0.6)
            }
        )

        return () => {
            posTweenRef.current?.kill()
            unsubscribeLevel()
            unsubscribeConfigs()
        }
    }, [camera])

    // Resize / orientation: refit y to the new aspect. z target is governed
    // by currentLevel and stays in `targetRef` from the level subscription,
    // so the tween here pulls both axes toward the right destination even
    // if the user rotates mid-transition.
    useEffect(() => {
        const game = useGame.getState()
        targetRef.current.y = computeY(game.currentLevel)
        targetRef.current.z = levelZ(game.currentLevel)
        posTweenRef.current?.kill()
        posTweenRef.current = gsap.to(camera.position, {
            y: targetRef.current.y,
            z: targetRef.current.z,
            duration: 0.4,
        })
    }, [camera, size.width, size.height])

    return null
}
