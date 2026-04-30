import gsap from 'gsap'
import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import type { ThreeEvent } from '@react-three/fiber'

import { useResource } from '../stores/useResource'
import useButtonAnimation from '../utils/useButtonAnimation'
import useGame, { BoxState } from '../stores/useGame'
import type { BoxStateValue } from '../stores/useGame'
import useBoxSettings from '../stores/useBoxSettings'
import useHint from '../stores/useHint'
import { dragTracker } from '../utils/dragTracker'
import { longPressTracker, LONG_PRESS_MS } from '../utils/longPressTracker'

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

function getFlip(dx: number, dy: number) {
    const ax = Math.abs(dx)
    const ay = Math.abs(dy)
    if (ax === 0 && ay === 0) return { x: Math.PI, y: 0, z: 0 }
    if (ax >= ay) return { x: 0, y: 0, z: dx > 0 ? -Math.PI : Math.PI }
    return { x: dy > 0 ? Math.PI : -Math.PI, y: 0, z: 0 }
}


export default function Box({ group, levelIndex, row, col, gridSize, spacing, interactive = true }: BoxProps) {
    const boxState = useGame((state) => state.levels[levelIndex]?.[row]?.[col] ?? BoxState.BLANK)
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
    const wrongTlRef    = useRef<gsap.core.Timeline | null>(null)
    const spinDirRef    = useRef({ y: 1, x: 0.4 })
    const prevStateRef  = useRef<BoxStateValue>(BoxState.BLANK)
    const { ref: box, enter: pointerEnter, leave: pointerLeave } = useButtonAnimation()

    useEffect(() => {
        if (!box.current) return

        const { lockBaseDelay, lockDelayPerUnit, lockDuration, boxleScale, glowScale, markSize, lockMarkSize, markDuration } = useBoxSettings.getState()
        const prev = prevStateRef.current
        prevStateRef.current = boxState

        const alreadyFlipped = prev === BoxState.MARK || prev === BoxState.LOCK

        if (boxState === BoxState.MARK) {
            if (!alreadyFlipped) {
                const flip = getFlip(dragTracker.movementX, dragTracker.movementY)
                gsap.to(box.current.rotation, { ...flip, duration: markDuration })
            }
            if (markRef.current) gsap.to(markRef.current.scale, { x: markSize, z: markSize, duration: markDuration, ease: 'back.out(2)' })
        } else if (boxState === BoxState.LOCK) {
            let delay = 0
            if (!alreadyFlipped) {
                const boxlePos = useGame.getState().lastBoxlePosition
                let flip = { x: Math.PI, y: 0, z: 0 }
                if (boxlePos && boxlePos.levelIndex === levelIndex) {
                    const dx = col - boxlePos.col
                    const dy = row - boxlePos.row
                    delay = lockBaseDelay + lockDelayPerUnit * Math.sqrt(dx * dx + dy * dy)
                    flip = getFlip(dx, dy)
                }
                gsap.to(box.current.rotation, { ...flip, duration: lockDuration, delay })
            }
            if (markRef.current) gsap.to(markRef.current.scale, { x: lockMarkSize, z: lockMarkSize, duration: lockDuration * 0.8, delay, ease: 'back.out(2)' })
        } else if (boxState === BoxState.BLANK) {
            // Kill any in-flight or delayed tweens before resetting
            gsap.killTweensOf(box.current.rotation)
            if (markRef.current)       gsap.killTweensOf(markRef.current.scale)
            if (boxleMeshRef.current) gsap.killTweensOf(boxleMeshRef.current.scale)
            if (glowRef.current)       gsap.killTweensOf(glowRef.current.scale)

            if (prev === BoxState.LOCK || prev === BoxState.BOXLE) {
                // Only happens on restart — instant reset, no animation
                box.current.rotation.set(0, 0, 0)
                if (markRef.current)       markRef.current.scale.set(0, 0.1, 0)
                if (boxleMeshRef.current) { boxleMeshRef.current.scale.set(1, 1, 1); boxleMeshRef.current.rotation.set(0, 0, 0) }
                if (glowRef.current)       glowRef.current.scale.set(0, 0, 0)
            } else {
                // User toggled off a mark — animate the flip back
                gsap.to(box.current.rotation, { x: 0, y: 0, z: 0, duration: markDuration })
                if (markRef.current) gsap.to(markRef.current.scale, { x: 0, z: 0, duration: markDuration * 0.75 })
            }
        } else if (boxState === BoxState.BOXLE) {
            spinDirRef.current = {
                y: Math.random() < 0.5 ? 1 : -1,
                x: (Math.random() * 0.6 + 0.2) * (Math.random() < 0.5 ? 1 : -1),
            }
            gsap.to(box.current.rotation, { x: 0, y: 0, z: 0, duration: 0.3, ease: 'back.out(1.5)' })
            if (markRef.current) gsap.to(markRef.current.scale, { x: 0, z: 0, duration: 0.15 })
            if (boxleMeshRef.current) gsap.to(boxleMeshRef.current.scale, { x: boxleScale, y: boxleScale, z: boxleScale, duration: 0.4, ease: 'back.out(1.5)' })
            if (glowRef.current)       gsap.to(glowRef.current.scale,       { x: glowScale,   y: glowScale,   z: glowScale,   duration: 0.4, ease: 'back.out(1.5)' })
        }
    }, [boxState])

    // Dim overlay only mounts when this box is being dimmed by an active hint.
    // Lingers briefly after the hint clears so the shared fade-out tween can finish.
    const [showDim, setShowDim] = useState(false)
    const needsDim = hintActive && !hintRole
    useEffect(() => {
        if (needsDim) {
            setShowDim(true)
        } else {
            const t = setTimeout(() => setShowDim(false), 350)
            return () => clearTimeout(t)
        }
    }, [needsDim])

    useEffect(() => {
        if (!isWrongPlacement || !box.current) return

        wrongTlRef.current?.kill()
        const baseX = box.current.position.x

        const tl = gsap.timeline({
            onComplete: () => {
                useGame.getState().clearWrongPlacement()
                if (useGame.getState().lives === 0) useGame.getState().end()
            },
        })

        // Red flash — peaks fast, lingers as it fades
        tl.to(wrongMaterial, { opacity: 0.7, duration: 0.05, ease: 'none' })
        tl.to(wrongMaterial, { opacity: 0,   duration: 0.4,  ease: 'power2.out' })

        // Shake — runs in parallel with the flash
        tl.to(box.current.position, { x: baseX + 0.22, duration: 0.05, ease: 'none'   }, 0)
        tl.to(box.current.position, { x: baseX - 0.18, duration: 0.07, ease: 'none'   }, 0.05)
        tl.to(box.current.position, { x: baseX + 0.13, duration: 0.07, ease: 'none'   }, 0.12)
        tl.to(box.current.position, { x: baseX - 0.08, duration: 0.06, ease: 'none'   }, 0.19)
        tl.to(box.current.position, { x: baseX + 0.03, duration: 0.05, ease: 'none'   }, 0.25)
        tl.to(box.current.position, { x: baseX,        duration: 0.05, ease: 'power1.out' }, 0.30)

        wrongTlRef.current = tl
        return () => { tl.kill() }
    }, [isWrongPlacement])

    useFrame((_, delta) => {
        if (boxState === BoxState.BOXLE && boxleMeshRef.current) {
            const { enableSpin, boxleSpinSpeed } = useBoxSettings.getState()
            if (enableSpin) {
                boxleMeshRef.current.rotation.y += delta * boxleSpinSpeed * spinDirRef.current.y
                boxleMeshRef.current.rotation.x += delta * boxleSpinSpeed * spinDirRef.current.x
            }
        }
    })

    // Unmount cleanup: kill any in-flight tweens against this box's targets so
    // they don't continue mutating refs after they're detached. Lock-cascade
    // tweens with `delay` are the most important to catch — they outlive the
    // mount when a level is restarted mid-cascade.
    useEffect(() => {
        return () => {
            if (box.current) gsap.killTweensOf(box.current.rotation)
            if (box.current) gsap.killTweensOf(box.current.position)
            if (markRef.current) gsap.killTweensOf(markRef.current.scale)
            if (boxleMeshRef.current) gsap.killTweensOf(boxleMeshRef.current.scale)
            if (glowRef.current) gsap.killTweensOf(glowRef.current.scale)
            chargeTweenRef.current?.kill()
            if (chargeMeshRef.current) gsap.killTweensOf(chargeMeshRef.current.scale)
            wrongTlRef.current?.kill()
        }
    }, [])

    const position: [number, number, number] = [
        ((col - gridSize / 2) + 0.5) * spacing,
        0,
        ((row - gridSize / 2) + 0.5) * spacing,
    ]

    const isBlocked = hintActive && !hintRole

    const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
        if (!interactive || isBlocked) return
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
        if (!interactive || isBlocked) return
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
        if (!interactive || isBlocked) return
        dragTracker.maybeStartDrag(e.nativeEvent)
    }

    const handlePointerLeave = (e: ThreeEvent<PointerEvent>) => {
        pointerLeave(e)
        if (!interactive || isBlocked) return
        dragTracker.maybeStartDrag(e.nativeEvent)
    }

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        if (!interactive || isBlocked) return
        e.stopPropagation()
        if (dragTracker.hasDragged || e.nativeEvent.shiftKey) return
        if (boxState === BoxState.BLANK || boxState === BoxState.MARK) toggleMark(levelIndex, row, col)
    }

    const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
        if (!interactive || isBlocked) return
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

    return (
        <group position={position} ref={box}>
            <mesh
                ref={boxleMeshRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleDoubleClick}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
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
