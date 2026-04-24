import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import LevelManager from './LevelManager'
import CameraManager from './CameraManager'
import Display from './Display'
import useShiftKey from './utils/useShiftKey'

const CIRCLE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='11' fill='none' stroke='%23222' stroke-width='3.5'/%3E%3C/svg%3E") 16 16, crosshair`

function ModifierCursor() {
    const { gl } = useThree()
    const shiftHeld = useShiftKey()

    useEffect(() => {
        gl.domElement.style.cursor = shiftHeld ? CIRCLE_CURSOR : ''
    }, [shiftHeld, gl])

    return null
}

export default function Game() {
    return (
        <group>
            <ModifierCursor />
            <Display />
            <LevelManager />
            <CameraManager />
        </group>
    )
}
