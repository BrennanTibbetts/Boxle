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
    const prevTargetRef = useRef<number>(0)
    const prevInputsRef = useRef<string>('')
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

        // All inputs to boardPx + target are stable between user actions
        // (camera tween, viewport resize, level change, rules toggle). Recompute
        // only when one of them actually changes, then approach the target.
        const inputsKey = `${cam.position.y}|${cam.fov}|${size.width}|${size.height}|${gridSize}|${rulesOpen ? 1 : 0}|${slideEnabled ? 1 : 0}`
        if (inputsKey !== prevInputsRef.current) {
            prevInputsRef.current = inputsKey
            const fovRad = (cam.fov * Math.PI) / 180
            const aspect = size.width / size.height
            const tanHalfFov = Math.tan(fovRad / 2)

            const visibleAtBoard = 2 * cam.position.y * tanHalfFov * aspect
            const boardPx = (gridSize * BOX_SPACING * size.width) / visibleAtBoard
            if (Math.abs(boardPx - prevBoardPxRef.current) > 0.01) {
                document.documentElement.style.setProperty('--board-width-px', `${boardPx}px`)
                prevBoardPxRef.current = boardPx
            }

            let target = 0
            if (rulesOpen && slideEnabled) {
                const visibleAtTitle = 2 * (cam.position.y - TITLE_Y) * tanHalfFov * aspect
                const worldPerPxAtTitle = visibleAtTitle / size.width
                target = (boardPx / 2) * worldPerPxAtTitle
            }
            prevTargetRef.current = target
        }

        if (!groupRef.current) return
        const cur = groupRef.current.position.x
        const target = prevTargetRef.current
        if (Math.abs(target - cur) > 0.0001) {
            groupRef.current.position.x = cur + (target - cur) * 0.12
        }
    })

    return (
        <group ref={groupRef}>
            {activeMode !== GameMode.MENU && <Title />}
        </group>
    )
}
