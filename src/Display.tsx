import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group, PerspectiveCamera } from 'three'
import Title from './components/Title'
import useGame from './stores/useGame'
import useUI from './stores/useUI'

const TITLE_Y = -0.5
const BOX_SPACING = 1

export default function Display() {
    const groupRef = useRef<Group>(null)
    const rulesOpen = useUI((state) => state.rulesOpen)
    const currentLevel = useGame((state) => state.currentLevel)
    const configs = useGame((state) => state.levelConfigs)
    const { camera, size } = useThree()

    useFrame(() => {
        const cfg = configs[currentLevel - 1]
        if (!cfg) return

        const gridSize = cfg.levelMatrix.length
        const cam = camera as PerspectiveCamera
        const fovRad = (cam.fov * Math.PI) / 180
        const aspect = size.width / size.height
        const tanHalfFov = Math.tan(fovRad / 2)

        const visibleAtBoard = 2 * cam.position.y * tanHalfFov * aspect
        const boardPx = (gridSize * BOX_SPACING * size.width) / visibleAtBoard
        document.documentElement.style.setProperty('--board-width-px', `${boardPx}px`)

        if (!groupRef.current) return
        let target = 0
        if (rulesOpen) {
            const visibleAtTitle = 2 * (cam.position.y - TITLE_Y) * tanHalfFov * aspect
            const worldPerPxAtTitle = visibleAtTitle / size.width
            target = (boardPx / 2) * worldPerPxAtTitle
        }
        groupRef.current.position.x += (target - groupRef.current.position.x) * 0.12
    })

    return (
        <group ref={groupRef}>
            <Title />
        </group>
    )
}
