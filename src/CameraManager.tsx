import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import gsap from 'gsap'
import { useControls } from 'leva'
import useGame from './stores/useGame'

const BOX_SPACING = 1
// 15% margin so the board doesn't kiss the edge of the viewport in portrait.
const PORTRAIT_FIT_MARGIN = 1.15

// Camera height needed to fit `gridSize` boxes wide at this aspect, given the
// camera's vertical FOV. Returns the *minimum* y; callers take a max with the
// configured base height so landscape stays unchanged.
function requiredCameraY(gridSize: number, aspect: number, fovDeg: number): number {
    const fovRad = (fovDeg * Math.PI) / 180
    const tanHalfFov = Math.tan(fovRad / 2)
    return (gridSize * BOX_SPACING * PORTRAIT_FIT_MARGIN) / (2 * tanHalfFov * aspect)
}

export default function CameraManager() {
    const { camera, size } = useThree()

    const props = useControls('Camera', {
        levelHeightIncrease: 0.4,
        cameraHeightY: 16,
        boardSpacing: 16,
    })

    // Live values read inside subscription callbacks. Subscriptions install
    // once (only `camera` in the dep array) so resize observers can't tear
    // down the listener between a `placeBoxle` set and the level-change
    // tween — that race silently dropped portrait level transitions.
    const aspectRef = useRef(1)
    const cameraHeightYRef = useRef(props.cameraHeightY)
    const levelHeightIncreaseRef = useRef(props.levelHeightIncrease)
    const boardSpacingRef = useRef(props.boardSpacing)

    aspectRef.current = size.width / Math.max(size.height, 1)
    cameraHeightYRef.current = props.cameraHeightY
    levelHeightIncreaseRef.current = props.levelHeightIncrease
    boardSpacingRef.current = props.boardSpacing

    // The camera's intended (y, z) destination. Every tween restart reads
    // both axes from here so resize-mid-transition can't strand z partway.
    const targetRef = useRef({ y: 0, z: 0 })
    const posTweenRef = useRef<gsap.core.Tween | null>(null)

    useEffect(() => {
        const cam = camera as PerspectiveCamera

        const computeY = (level: number) => {
            const game = useGame.getState()
            const cfg = game.levelConfigs[level - 1]
            const gridSize = cfg ? cfg.levelMatrix.length : 1
            const fitY = requiredCameraY(gridSize, aspectRef.current, cam.fov)
            return Math.max(cameraHeightYRef.current, fitY) + (level - 1) * levelHeightIncreaseRef.current
        }

        const tweenToTarget = (duration: number) => {
            posTweenRef.current?.kill()
            posTweenRef.current = gsap.to(camera.position, {
                y: targetRef.current.y,
                z: targetRef.current.z,
                duration,
            })
        }

        const { currentLevel, cameraRotationZ } = useGame.getState()
        targetRef.current.y = computeY(currentLevel)
        targetRef.current.z = -boardSpacingRef.current * (currentLevel - 1)
        camera.position.y = targetRef.current.y
        camera.position.z = targetRef.current.z
        camera.rotation.z = -cameraRotationZ

        let rotTween: gsap.core.Tween | null = null

        const unsubscribeLevel = useGame.subscribe(
            (state) => state.currentLevel,
            (value) => {
                targetRef.current.y = computeY(value)
                targetRef.current.z = -boardSpacingRef.current * (value - 1)
                tweenToTarget(1)
            }
        )

        // levelConfigs flips from [] to populated on first mount of the
        // active mode, and on Arcade puzzle appends. currentLevel often
        // doesn't change in those transitions, so we refit y here.
        const unsubscribeConfigs = useGame.subscribe(
            (state) => state.levelConfigs,
            () => {
                const game = useGame.getState()
                targetRef.current.y = computeY(game.currentLevel)
                tweenToTarget(0.6)
            }
        )

        const unsubscribeRotation = useGame.subscribe(
            (state) => state.cameraRotationZ,
            (value) => {
                rotTween?.kill()
                rotTween = gsap.to(camera.rotation, { z: -value, duration: 1 })
            }
        )

        return () => {
            posTweenRef.current?.kill()
            rotTween?.kill()
            unsubscribeLevel()
            unsubscribeConfigs()
            unsubscribeRotation()
        }
    }, [camera])

    // Resize / orientation: refit y to the new aspect. z target is governed
    // by currentLevel and stays in `targetRef` from the level subscription,
    // so the tween here pulls both axes toward the right destination even
    // if the user rotates mid-transition.
    useEffect(() => {
        const cam = camera as PerspectiveCamera
        const game = useGame.getState()
        const cfg = game.levelConfigs[game.currentLevel - 1]
        const gridSize = cfg ? cfg.levelMatrix.length : 1
        const fitY = requiredCameraY(gridSize, aspectRef.current, cam.fov)
        targetRef.current.y = Math.max(cameraHeightYRef.current, fitY) + (game.currentLevel - 1) * levelHeightIncreaseRef.current
        targetRef.current.z = -boardSpacingRef.current * (game.currentLevel - 1)
        posTweenRef.current?.kill()
        posTweenRef.current = gsap.to(camera.position, {
            y: targetRef.current.y,
            z: targetRef.current.z,
            duration: 0.4,
        })
    }, [camera, size.width, size.height])

    return null
}
