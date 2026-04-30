import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group, PerspectiveCamera } from 'three'
import Title from './components/Title'
import useGame, { GameMode } from './stores/useGame'
import useUI from './stores/useUI'
import { useIsMobile } from './hooks/useIsMobile'

const TITLE_Y = -0.5
const BOX_SPACING = 1

export default function Display() {
    const groupRef = useRef<Group>(null)
    const prevBoardPxRef = useRef<number>(0)
    const rulesOpen = useUI((state) => state.rulesOpen)
    const currentLevel = useGame((state) => state.currentLevel)
    const configs = useGame((state) => state.levelConfigs)
    const activeMode = useGame((state) => state.activeMode)
    const isMobile = useIsMobile()
    const { camera, size } = useThree()

    // The board / title side-slide is purely an in-game-on-desktop affordance.
    // Off the menu (no live board), or on mobile (full-width centered modal),
    // we skip the slide entirely.
    const slideEnabled = activeMode !== GameMode.MENU && !isMobile

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
        // Only touch the CSSOM when the value actually changes (avoids a
        // style recompute every frame for a value that's stable mid-level).
        if (Math.abs(boardPx - prevBoardPxRef.current) > 0.01) {
            document.documentElement.style.setProperty('--board-width-px', `${boardPx}px`)
            prevBoardPxRef.current = boardPx
        }

        if (!groupRef.current) return
        let target = 0
        if (rulesOpen && slideEnabled) {
            const visibleAtTitle = 2 * (cam.position.y - TITLE_Y) * tanHalfFov * aspect
            const worldPerPxAtTitle = visibleAtTitle / size.width
            target = (boardPx / 2) * worldPerPxAtTitle
        }
        groupRef.current.position.x += (target - groupRef.current.position.x) * 0.12
    })

    return (
        <group ref={groupRef}>
            {activeMode !== GameMode.MENU && <Title />}
        </group>
    )
}
