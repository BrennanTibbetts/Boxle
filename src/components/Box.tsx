import gsap from 'gsap'
import { useRef, useMemo, useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import type { ThreeEvent } from '@react-three/fiber'

import { useResource } from '../stores/useResource'
import useButtonAnimation from '../utils/useButtonAnimation'
import useGame, { BoxState, Phase } from '../stores/useGame'
import useBoxSettings from '../stores/useBoxSettings'
import useHint, { HINT_DIM_FADE_S } from '../stores/useHint'
import { dragTracker } from '../utils/dragTracker'
import { boxWorldXZ } from '../hooks/useBoardLayout'
import { longPressTracker, LONG_PRESS_MS } from '../utils/longPressTracker'
import { useBoxStateAnimation, useWrongShake } from './useBoxAnimations'

const CHARGE_PEAK_SCALE = 0.5
const CHARGE_OUT_DURATION = 0.18

interface BoxProps {
    group: number
    levelIndex: number
    row: number
    col: number
    gridSize: number
    spacing: number
    interactive?: boolean
}

// Spin loop for a placed boxle. Mounted only while its box holds a boxle, so
// the R3F frame loop iterates one callback per placed boxle instead of one
// per box (hundreds-to-thousands of no-op invocations per frame otherwise).
function BoxleSpin({ meshRef, dirRef }: {
    meshRef: RefObject<Mesh | null>
    dirRef: RefObject<{ y: number; x: number }>
}) {
    useFrame(({ invalidate }, delta) => {
        const mesh = meshRef.current
        if (!mesh) return
        const { enableSpin, boxleSpinSpeed } = useBoxSettings.getState()
        if (!enableSpin) return
        mesh.rotation.y += delta * boxleSpinSpeed * dirRef.current.y
        mesh.rotation.x += delta * boxleSpinSpeed * dirRef.current.x
        // frameloop="demand": a spinning boxle never converges — keep chaining.
        invalidate()
    })
    return null
}

export default function Box({ group, levelIndex, row, col, gridSize, spacing, interactive = true }: BoxProps) {
    const boxState = useGame((state) => state.levels[levelIndex]?.[row]?.[col] ?? BoxState.BLANK)
    // Block all input during the board-intro (Phase.READY) — the board is on
    // display, not yet in play. Shadows stay on (castShadow keys off
    // `interactive`, not this) so the hero shot still reads as 3D.
    const canPlay = useGame((state) => state.phase === Phase.PLAYING)
    const placeBoxle = useGame((state) => state.placeBoxle)
    const toggleMark = useGame((state) => state.toggleMark)
    const hintRole   = useHint((state) => state.getBoxRole(levelIndex, row, col))
    const hintActive = useHint((state) => state.activeHint !== null)

    const geometry       = useMemo(() => useResource.getState().geometries.get('box')!, [])
    const markMaterial   = useMemo(() => useResource.getState().materials.get('mark')!, [])
    const material       = useMemo(() => useResource.getState().getGroupMaterial(group), [group])
    const boxleMaterial  = useMemo(() => useResource.getState().getBoxleMaterial(group), [group])
    const glowMaterial   = useMemo(() => useResource.getState().getGlowMaterial(group), [group])
    const dimMaterial    = useMemo(() => useResource.getState().getDimMaterial(), [])
    const wrongMaterial  = useMemo(() => useResource.getState().getWrongMaterial(), [])

    const isWrongPlacement = useGame((state) =>
        state.wrongPlacement?.levelIndex === levelIndex &&
        state.wrongPlacement?.row === row &&
        state.wrongPlacement?.col === col
    )

    const boxleMeshRef = useRef<Mesh>(null)
    const glowRef       = useRef<Mesh>(null)
    const markRef       = useRef<Mesh>(null)
    const chargeMeshRef = useRef<Mesh>(null)
    const chargeTweenRef = useRef<gsap.core.Tween | null>(null)
    const spinDirRef    = useRef({ y: 1, x: 0.4 })
    const { ref: box, enter: pointerEnter, leave: pointerLeave } = useButtonAnimation()

    // The boxState transition machine (mark flip, lock cascade, boxle pop,
    // undo/restart reset) and the wrong-placement flash+shake — see
    // useBoxAnimations.ts. Both own their tween cleanup.
    useBoxStateAnimation({ boxRef: box, markRef, boxleMeshRef, glowRef, spinDirRef, boxState, levelIndex, row, col })
    useWrongShake(box, wrongMaterial, isWrongPlacement)

    // Dim overlay only mounts when this box is being dimmed by an active hint.
    // Lingers briefly after the hint clears so the shared fade-out tween can finish.
    const [showDim, setShowDim] = useState(false)
    const needsDim = hintActive && !hintRole
    useEffect(() => {
        if (needsDim) {
            setShowDim(true)
        } else {
            // Linger just past the shared dim fade-out so the overlay doesn't
            // unmount mid-fade.
            const t = setTimeout(() => setShowDim(false), HINT_DIM_FADE_S * 1000 + 50)
            return () => clearTimeout(t)
        }
    }, [needsDim])

    // Unmount cleanup for the tweens Box itself owns (hover scale, charge) —
    // the animation hooks above clean up their own targets.
    useEffect(() => {
        return () => {
            if (box.current) gsap.killTweensOf(box.current.scale)
            chargeTweenRef.current?.kill()
            if (chargeMeshRef.current) gsap.killTweensOf(chargeMeshRef.current.scale)
        }
    }, [])

    const [worldX, worldZ] = boxWorldXZ(row, col, gridSize, spacing)
    const position: [number, number, number] = [worldX, 0, worldZ]

    const isBlocked = hintActive && !hintRole

    const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
        if (!interactive || isBlocked || !canPlay) return
        pointerEnter(e)
        if (e.nativeEvent.buttons !== 1) return
        // Skip the synthetic pointerenter R3F fires on the start box right
        // after pointerdown — without this, we'd toggle the start box here
        // AND again when pendingDragMark fires mid-drag, leaving it
        // unmarked. The flag clears itself on first match so a real
        // drag-back into the same box still toggles.
        if (dragTracker.consumeStartBox(`${row},${col}`)) return
        if (e.nativeEvent.shiftKey) {
            if (boxState === BoxState.MARK) toggleMark(levelIndex, row, col)
        } else {
            if (boxState === BoxState.BLANK) toggleMark(levelIndex, row, col)
        }
    }

    const animateChargeOut = (snap = false) => {
        chargeTweenRef.current?.kill()
        if (!chargeMeshRef.current) return
        if (snap) {
            chargeMeshRef.current.scale.set(0, 0, 0)
        } else {
            chargeTweenRef.current = gsap.to(chargeMeshRef.current.scale, {
                x: 0, y: 0, z: 0, duration: CHARGE_OUT_DURATION, ease: 'power1.in',
            })
        }
    }

    const animateChargeIn = () => {
        if (!chargeMeshRef.current) return
        chargeTweenRef.current?.kill()
        chargeMeshRef.current.scale.set(0, 0, 0)
        chargeTweenRef.current = gsap.to(chargeMeshRef.current.scale, {
            x: CHARGE_PEAK_SCALE, y: CHARGE_PEAK_SCALE, z: CHARGE_PEAK_SCALE,
            duration: LONG_PRESS_MS / 1000,
            ease: 'sine.in',
        })
    }

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (!interactive || isBlocked || !canPlay) return
        e.stopPropagation()
        const isTouch = e.nativeEvent.pointerType !== 'mouse'

        if (e.nativeEvent.shiftKey) {
            dragTracker.setHasDragged(true)
            dragTracker.setPendingDragMark(null)
            if (boxState === BoxState.MARK) toggleMark(levelIndex, row, col)
            return
        }

        dragTracker.setHasDragged(false)
        dragTracker.setDownPosition(e.nativeEvent.clientX, e.nativeEvent.clientY)
        dragTracker.setStartBox(`${row},${col}`)
        dragTracker.setPendingDragMark(
            boxState === BoxState.BLANK
                ? () => toggleMark(levelIndex, row, col)
                : null
        )

        // Touch/pen: long-press places. Tap (release before timer) falls
        // through to handleClick which toggles the mark.
        if (isTouch && (boxState === BoxState.BLANK || boxState === BoxState.MARK)) {
            animateChargeIn()
            longPressTracker.start(e.nativeEvent, {
                onCommit: () => {
                    dragTracker.setHasDragged(true)
                    dragTracker.setPendingDragMark(null)
                    placeBoxle(levelIndex, row, col)
                    // The BOXLE-state effect handles the visible boxle; snap
                    // the charge mesh away so it doesn't overlap the new boxle.
                    animateChargeOut(true)
                },
                onCancel: () => animateChargeOut(),
            })
        }
    }

    // Drag-mark for the *starting* box. Subsequent boxes get marked via
    // handlePointerEnter as the pointer crosses into them — these two
    // handlers cover the *origin* box, which would otherwise only get a
    // pointerdown event and never a pointerenter (pointer was already on
    // it when contact began). pointerleave is the most reliable trigger
    // on iOS Safari because R3F fires it as the raycast result changes —
    // the same path that already works for pointerenter on box 2.
    // pointermove is the fallback for big-box-small-drag cases where the
    // pointer never leaves the origin box but still passes the threshold.
    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!interactive || isBlocked || !canPlay) return
        dragTracker.maybeStartDrag(e.nativeEvent)
    }

    const handlePointerLeave = (e: ThreeEvent<PointerEvent>) => {
        pointerLeave(e)
        if (!interactive || isBlocked || !canPlay) return
        dragTracker.maybeStartDrag(e.nativeEvent)
    }

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        if (!interactive || isBlocked || !canPlay) return
        e.stopPropagation()
        if (dragTracker.hasDragged || e.nativeEvent.shiftKey) return
        // The 2nd+ click of a double-click (detail >= 2) is the place-a-boxle
        // gesture, handled by onDoubleClick — not a mark. Toggling here would
        // churn the mark on/off mid-double-click and leak phantom marks into
        // the undo stack. A double-click is one intent: place a boxle.
        if (e.nativeEvent.detail >= 2) return
        if (boxState === BoxState.BLANK || boxState === BoxState.MARK) toggleMark(levelIndex, row, col)
    }

    const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
        if (!interactive || isBlocked || !canPlay) return
        e.stopPropagation()
        e.nativeEvent.preventDefault()
        if (boxState === BoxState.BLANK || boxState === BoxState.MARK) placeBoxle(levelIndex, row, col)
    }

    const isBoxle = boxState === BoxState.BOXLE

    // When a boxle is placed, the visible extent is the glow (child of the boxle
    // mesh), so dim coverage shrinks to boxleScale * glowScale in world space.
    const boxleScaleSetting = useBoxSettings((s) => s.boxleScale)
    const glowScaleSetting = useBoxSettings((s) => s.glowScale)
    const dimScale = isBoxle ? boxleScaleSetting * glowScaleSetting : 1.0

    // Only the playable board's meshes register pointer handlers — a mesh
    // with handlers joins R3F's interaction list and gets raycast on every
    // pointer move, so attaching them to ghost/intro boards would raycast
    // hundreds of extra meshes during the latency-sensitive drag gesture.
    const eventHandlers = interactive ? {
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onClick: handleClick,
        onDoubleClick: handleDoubleClick,
        onContextMenu: handleDoubleClick,
        onPointerEnter: handlePointerEnter,
        onPointerLeave: handlePointerLeave,
    } : undefined

    return (
        <group position={position} ref={box}>
            {isBoxle && <BoxleSpin meshRef={boxleMeshRef} dirRef={spinDirRef} />}
            <mesh
                ref={boxleMeshRef}
                {...eventHandlers}
                castShadow={interactive}
                receiveShadow
                geometry={geometry}
                material={isBoxle ? boxleMaterial : material}
            >
                <mesh
                    ref={glowRef}
                    scale={0}
                    geometry={geometry}
                    material={glowMaterial}
                />
            </mesh>
            <mesh
                ref={markRef}
                renderOrder={3}
                position-y={-0.5}
                geometry={geometry}
                material={markMaterial}
                scale={[0, 0.1, 0]}
            />
            <mesh
                ref={chargeMeshRef}
                geometry={geometry}
                material={boxleMaterial}
                scale={0}
            />
            {showDim && <mesh geometry={geometry} material={dimMaterial} scale={dimScale} />}
            {isWrongPlacement && <mesh geometry={geometry} material={wrongMaterial} scale={1.0} />}
        </group>
    )
}
