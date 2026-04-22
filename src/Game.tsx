import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import LevelManager from './LevelManager'
import CameraManager from './CameraManager'
import Display from './Display'
import useShiftKey from './utils/useShiftKey'
import useCtrlKey from './utils/useCtrlKey'

const STAR_CURSOR   = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpolygon points='16,1 20.5,11 31.5,11 22.9,18.1 26.3,29.1 16,22.7 5.7,29.1 9.1,18.1 0.5,11 11.5,11' fill='%23FFD700' stroke='%23444' stroke-width='1.5'/%3E%3C/svg%3E") 16 16, crosshair`
const CIRCLE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='11' fill='none' stroke='%23222' stroke-width='3.5'/%3E%3C/svg%3E") 16 16, crosshair`

function ModifierCursor() {
    const { gl } = useThree()
    const shiftHeld = useShiftKey()
    const ctrlHeld = useCtrlKey()

    useEffect(() => {
        if (ctrlHeld) {
            gl.domElement.style.cursor = STAR_CURSOR
        } else if (shiftHeld) {
            gl.domElement.style.cursor = CIRCLE_CURSOR
        } else {
            gl.domElement.style.cursor = ''
        }
    }, [shiftHeld, ctrlHeld, gl])

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
