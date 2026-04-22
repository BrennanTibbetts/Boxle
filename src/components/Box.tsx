import gsap from 'gsap'
import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Mesh } from 'three'
import type { ThreeEvent } from '@react-three/fiber'

import { useResource } from '../stores/useResource'
import useButtonAnimation from '../utils/useButtonAnimation'
import useGame, { BoxState } from '../stores/useGame'
import type { BoxStateValue } from '../stores/useGame'
import useBoxSettings from '../stores/useBoxSettings'
import useHint from '../stores/useHint'

interface BoxProps {
    group: number
    levelIndex: number
    row: number
    col: number
    gridSize: number
    spacing: number
    interactive?: boolean
}

// Module-level drag tracking
let pendingDragMark: (() => void) | null = null
let hasDragged = false
let dragMovementX = 0
let dragMovementY = 0

window.addEventListener('pointerdown', () => { dragMovementX = 0; dragMovementY = 0 })
window.addEventListener('pointermove', (e) => {
    dragMovementX += e.movementX
    dragMovementY += e.movementY
    if (e.buttons === 1 && pendingDragMark && !hasDragged) {
        hasDragged = true
        pendingDragMark()
        pendingDragMark = null
    }
})
window.addEventListener('pointerup', () => {
    pendingDragMark = null
    hasDragged = false
})

function getFlip(dx: number, dy: number) {
    const ax = Math.abs(dx)
    const ay = Math.abs(dy)
    if (ax === 0 && ay === 0) return { x: Math.PI, y: 0, z: 0 }
    if (ax >= ay) return { x: 0, y: 0, z: dx > 0 ? -Math.PI : Math.PI }
    return { x: dy > 0 ? Math.PI : -Math.PI, y: 0, z: 0 }
}


export default function Box({ group, levelIndex, row, col, gridSize, spacing, interactive = true }: BoxProps) {
    const boxState = useGame((state) => state.levels[levelIndex]?.[row]?.[col] ?? BoxState.BLANK)
    const placeStar = useGame((state) => state.placeStar)
    const toggleMark = useGame((state) => state.toggleMark)
    const hintRole   = useHint((state) => state.getCellRole(levelIndex, row, col))
    const hintActive = useHint((state) => state.activeHint !== null)

    const geometry     = useMemo(() => useResource.getState().geometries.get('box')!, [])
    const markMaterial = useMemo(() => useResource.getState().materials.get('mark')!, [])
    const material     = useMemo(() => useResource.getState().getGroupMaterial(group), [group])
    const starMaterial = useMemo(() => useResource.getState().getStarMaterial(group), [group])
    const glowMaterial = useMemo(() => useResource.getState().getGlowMaterial(group), [group])

    const dimMaterial = useMemo(() => new THREE.MeshBasicMaterial({
        color: '#000000',
        transparent: true,
        opacity: 0,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -4,
    }), [])

    const [hintMat, setHintMat] = useState<THREE.MeshStandardMaterial | null>(null)

    useEffect(() => () => { dimMaterial.dispose() }, [])

    useEffect(() => {
        if (!hintRole) {
            setHintMat(prev => { prev?.dispose(); return null })
            return
        }
        const clone = (material as THREE.MeshStandardMaterial).clone()
        clone.depthTest = false
        setHintMat(prev => { prev?.dispose(); return clone })
        return () => clone.dispose()
    }, [hintRole])

    const starMeshRef = useRef<Mesh>(null)
    const glowRef     = useRef<Mesh>(null)
    const markRef     = useRef<Mesh>(null)
    const spinDirRef  = useRef({ y: 1, x: 0.4 })
    const prevStateRef = useRef<BoxStateValue>(BoxState.BLANK)
    const { ref: box, enter: pointerEnter, leave: pointerLeave } = useButtonAnimation()

    useEffect(() => {
        if (!box.current) return

        const { lockBaseDelay, lockDelayPerUnit, lockDuration, starBoxScale, glowScale, markSize, lockMarkSize, markDuration } = useBoxSettings.getState()
        const prev = prevStateRef.current
        prevStateRef.current = boxState

        const alreadyFlipped = prev === BoxState.MARK || prev === BoxState.LOCK

        if (boxState === BoxState.MARK) {
            if (!alreadyFlipped) {
                const flip = getFlip(dragMovementX, dragMovementY)
                gsap.to(box.current.rotation, { ...flip, duration: markDuration })
            }
            if (markRef.current) gsap.to(markRef.current.scale, { x: markSize, z: markSize, duration: markDuration, ease: 'back.out(2)' })
        } else if (boxState === BoxState.LOCK) {
            let delay = 0
            if (!alreadyFlipped) {
                const starPos = useGame.getState().lastStarPosition
                let flip = { x: Math.PI, y: 0, z: 0 }
                if (starPos && starPos.levelIndex === levelIndex) {
                    const dx = col - starPos.col
                    const dy = row - starPos.row
                    delay = lockBaseDelay + lockDelayPerUnit * Math.sqrt(dx * dx + dy * dy)
                    flip = getFlip(dx, dy)
                }
                gsap.to(box.current.rotation, { ...flip, duration: lockDuration, delay })
            }
            if (markRef.current) gsap.to(markRef.current.scale, { x: lockMarkSize, z: lockMarkSize, duration: lockDuration * 0.8, delay, ease: 'back.out(2)' })
        } else if (boxState === BoxState.BLANK) {
            gsap.to(box.current.rotation, { x: 0, y: 0, z: 0, duration: markDuration })
            if (markRef.current) gsap.to(markRef.current.scale, { x: 0, z: 0, duration: markDuration * 0.75 })
        } else if (boxState === BoxState.STAR) {
            spinDirRef.current = {
                y: Math.random() < 0.5 ? 1 : -1,
                x: (Math.random() * 0.6 + 0.2) * (Math.random() < 0.5 ? 1 : -1),
            }
            gsap.to(box.current.rotation, { x: 0, y: 0, z: 0, duration: 0.3, ease: 'back.out(1.5)' })
            if (markRef.current) gsap.to(markRef.current.scale, { x: 0, z: 0, duration: 0.15 })
            if (starMeshRef.current) gsap.to(starMeshRef.current.scale, { x: starBoxScale, y: starBoxScale, z: starBoxScale, duration: 0.4, ease: 'back.out(1.5)' })
            if (glowRef.current)     gsap.to(glowRef.current.scale,     { x: glowScale,    y: glowScale,    z: glowScale,    duration: 0.4, ease: 'back.out(1.5)' })
        }
    }, [boxState])

    useEffect(() => {
        const { hintDimOpacity } = useBoxSettings.getState()
        const targetOpacity = hintActive && !hintRole ? hintDimOpacity : 0
        gsap.to(dimMaterial, { opacity: targetOpacity, duration: 0.3, ease: 'power2.out' })
    }, [hintActive, hintRole])

    useFrame((_, delta) => {
        if (boxState === BoxState.STAR && starMeshRef.current) {
            const { enableSpin, starSpinSpeed } = useBoxSettings.getState()
            if (enableSpin) {
                starMeshRef.current.rotation.y += delta * starSpinSpeed * spinDirRef.current.y
                starMeshRef.current.rotation.x += delta * starSpinSpeed * spinDirRef.current.x
            }
        }
    })

    const position: [number, number, number] = [
        ((col - gridSize / 2) + 0.5) * spacing,
        0,
        ((row - gridSize / 2) + 0.5) * spacing,
    ]

    const isBlocked = hintActive && !hintRole

    const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
        pointerEnter(e)
        if (!interactive || isBlocked || e.nativeEvent.buttons !== 1) return
        if (e.nativeEvent.shiftKey) {
            if (boxState === BoxState.MARK) toggleMark(levelIndex, row, col)
        } else if (!e.nativeEvent.ctrlKey) {
            if (boxState === BoxState.BLANK) toggleMark(levelIndex, row, col)
        }
    }

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
        if (!interactive || isBlocked) return
        e.stopPropagation()
        if (e.nativeEvent.shiftKey) {
            hasDragged = true
            pendingDragMark = null
            if (boxState === BoxState.MARK) toggleMark(levelIndex, row, col)
        } else if (!e.nativeEvent.ctrlKey) {
            hasDragged = false
            pendingDragMark = boxState === BoxState.BLANK
                ? () => toggleMark(levelIndex, row, col)
                : null
        }
    }

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        if (!interactive || isBlocked) return
        e.stopPropagation()
        if (hasDragged || e.nativeEvent.shiftKey) return
        if (e.nativeEvent.ctrlKey) {
            if (boxState === BoxState.BLANK || boxState === BoxState.MARK) placeStar(levelIndex, row, col)
        } else {
            if (boxState === BoxState.BLANK || boxState === BoxState.MARK) toggleMark(levelIndex, row, col)
        }
    }

    const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
        if (!interactive || isBlocked) return
        e.stopPropagation()
        e.nativeEvent.preventDefault()
        if (boxState === BoxState.BLANK || boxState === BoxState.MARK) placeStar(levelIndex, row, col)
    }

    const isStar = boxState === BoxState.STAR

    return (
        <group position={position} ref={box}>
            <mesh
                ref={starMeshRef}
                renderOrder={hintRole ? 2 : 0}
                onPointerDown={handlePointerDown}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleDoubleClick}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={pointerLeave}
                castShadow
                receiveShadow
                geometry={geometry}
                material={hintMat ?? (isStar ? starMaterial : material)}
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
                geometry={geometry}
                material={dimMaterial}
                scale={1.0}
            />
        </group>
    )
}
