import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group, PerspectiveCamera } from 'three'
import Title from './components/Title'
import useGame, { GameMode, Phase } from './stores/useGame'
import useUI from './stores/useUI'
import { useIsMobile } from './hooks/useIsMobile'
import { BOX_SPACING } from './hooks/useBoardLayout'
import { TITLE_Y } from './components/Title'

export default function Display() {
    const groupRef = useRef<Group>(null)
    const prevBoardPxRef = useRef<number>(0)
    const prevTargetRef = useRef<number>(0)
    const prevInputsRef = useRef({ camY: NaN, fov: NaN, width: NaN, height: NaN, gridSize: NaN, rulesOpen: false, slideEnabled: false })
    const rulesOpen = useUI((state) => state.rulesOpen)
    const currentLevel = useGame((state) => state.currentLevel)
    const configs = useGame((state) => state.levelConfigs)
    const activeMode = useGame((state) => state.activeMode)
    const phase = useGame((state) => state.phase)
    const isMobile = useIsMobile()
    const { camera, size, invalidate } = useThree()

    // The board / title side-slide is purely an in-game-on-desktop affordance.
    // Off the menu (no live board), or on mobile (full-width centered modal),
    // we skip the slide entirely.
    const slideEnabled = activeMode !== GameMode.MENU && !isMobile

    // frameloop="demand": a rules toggle re-renders this component but doesn't
    // mutate any scene object, so R3F schedules no frame on its own — kick one
    // so the useFrame loop can recompute and start the slide chain.
    useEffect(() => { invalidate() }, [rulesOpen, slideEnabled, currentLevel, configs, phase, invalidate])

    useFrame(() => {
        const cfg = configs[currentLevel - 1]
        if (!cfg) return

        const gridSize = cfg.levelMatrix.length
        const cam = camera as PerspectiveCamera

        // All inputs to boardPx + target are stable between user actions
        // (camera tween, viewport resize, level change, rules toggle). Recompute
        // only when one of them actually changes, then approach the target.
        // Compared field-by-field — building a string key here would allocate
        // every frame.
        const prev = prevInputsRef.current
        if (
            prev.camY !== cam.position.y || prev.fov !== cam.fov ||
            prev.width !== size.width || prev.height !== size.height ||
            prev.gridSize !== gridSize || prev.rulesOpen !== rulesOpen ||
            prev.slideEnabled !== slideEnabled
        ) {
            prev.camY = cam.position.y
            prev.fov = cam.fov
            prev.width = size.width
            prev.height = size.height
            prev.gridSize = gridSize
            prev.rulesOpen = rulesOpen
            prev.slideEnabled = slideEnabled
            const fovRad = (cam.fov * Math.PI) / 180
            const aspect = size.width / size.height
            const tanHalfFov = Math.tan(fovRad / 2)

            const visibleAtBoard = 2 * cam.position.y * tanHalfFov * aspect
            const boardPx = (gridSize * BOX_SPACING * size.width) / visibleAtBoard
            // The CSS var's only consumer is `body.rules-open .r3f`, so only
            // write it while the rules are open — otherwise a camera tween
            // invalidates root-scoped style 60×/s for nothing. Opening the
            // rules changes an input above, so the value is fresh on open.
            if (rulesOpen && Math.abs(boardPx - prevBoardPxRef.current) > 0.01) {
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
            // frameloop="demand": keep requesting frames until the slide
            // converges (the rules toggle that started it only commits once).
            invalidate()
        }
    })

    return (
        <group ref={groupRef}>
            {activeMode !== GameMode.MENU && phase !== Phase.READY && <Title />}
        </group>
    )
}
