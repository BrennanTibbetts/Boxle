import { useFrame } from "@react-three/fiber"
import gsap from "gsap"
import { useEffect, useRef } from "react"
import useGame from "./stores/useGame"
import { useControls } from "leva"

export default function CameraManager() {

    const props = useControls("Camera", {
        levelHeightIncrease: 0.4      
    })

    const targetPosition = useRef({ x: 0, y: 16, z: 0 })
    const targetRotation = useRef({ x: -Math.PI/2, y: 0, z: 0 })

    useEffect(() => {
        const unsubscribeSetPosition= useGame.subscribe(
            (state) => state.cameraPosition,
            (value) => {
                targetPosition.current = value
            }
        )

        const unsubscribeLevel = useGame.subscribe(
            (state) => state.level,
            (value) => {
                targetPosition.current.y = targetPosition.current.y + (value-1) * props.levelHeightIncrease
                targetPosition.current.z = -12 * (value-1)
            }
        )

        const unsubscribeRotation = useGame.subscribe(
            (state) => state.cameraRotationZ,
            (value) => {
                targetRotation.current.z = -value
            }
        )

        return () => {
            unsubscribeSetPosition()
            unsubscribeLevel()
            unsubscribeRotation()
        }
    })

    useFrame((state) => {
        gsap.to(state.camera.position, {
            z: targetPosition.current.z,
            duration: 1
        })
        gsap.to(state.camera.rotation, {
            z: targetRotation.current.z,
            duration: 1
        })
    })

    return null
}