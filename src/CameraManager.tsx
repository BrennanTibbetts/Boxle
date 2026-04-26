import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { useControls } from 'leva'
import useGame from './stores/useGame'

export default function CameraManager() {
    const { camera } = useThree()

    const props = useControls('Camera', {
        levelHeightIncrease: 0.4,
        cameraHeightY: 16,
        boardSpacing: 16,
    })

    useEffect(() => {
        const { currentLevel, cameraRotationZ } = useGame.getState()
        camera.position.y = props.cameraHeightY + (currentLevel - 1) * props.levelHeightIncrease
        camera.position.z = -props.boardSpacing * (currentLevel - 1)
        camera.rotation.z = -cameraRotationZ

        const unsubscribeLevel = useGame.subscribe(
            (state) => state.currentLevel,
            (value) => {
                gsap.to(camera.position, {
                    y: props.cameraHeightY + (value - 1) * props.levelHeightIncrease,
                    z: -props.boardSpacing * (value - 1),
                    duration: 1,
                })
            }
        )

        const unsubscribeRotation = useGame.subscribe(
            (state) => state.cameraRotationZ,
            (value) => {
                gsap.to(camera.rotation, { z: -value, duration: 1 })
            }
        )

        return () => {
            unsubscribeLevel()
            unsubscribeRotation()
        }
    }, [camera, props.cameraHeightY, props.levelHeightIncrease, props.boardSpacing])

    return null
}
