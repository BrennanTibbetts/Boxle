import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { Color, Vector3, Mesh } from 'three'
import type { MeshStandardMaterial } from 'three'

import { useResource } from '../stores/useResource'
import useGame from '../stores/useGame'

interface LivesDisplayProps {
    levelSize?: number
}

function getLifeColor(lives: number): number {
    if (lives >= 3) return 0x22c55e
    if (lives === 2) return 0xeab308
    return 0xef4444
}

function getLifeScale(lives: number, barScale: [number, number, number]): Vector3 {
    const base = new Vector3(...barScale)
    if (lives >= 3) return base
    if (lives === 2) return base.multiply(new Vector3(2 / 3, 1, 1))
    if (lives === 1) return base.multiply(new Vector3(1 / 3, 1, 1))
    return base.multiply(new Vector3(0, 1, 1))
}

interface LerpFrameProps {
    materialRef: React.RefObject<MeshStandardMaterial | null>
    meshRef: React.RefObject<Mesh | null>
    currentColorRef: React.MutableRefObject<Color>
    targetColorRef: React.MutableRefObject<Color>
    currentScaleRef: React.MutableRefObject<Vector3>
    targetScaleRef: React.MutableRefObject<Vector3>
    animationDuration: number
    onSettle: () => void
}

function LerpFrame({
    materialRef, meshRef,
    currentColorRef, targetColorRef,
    currentScaleRef, targetScaleRef,
    animationDuration, onSettle,
}: LerpFrameProps) {
    useFrame((_state, delta) => {
        if (!materialRef.current || !meshRef.current) return

        const lerpFactor = delta / animationDuration
        const colorDistance =
            Math.abs(currentColorRef.current.r - targetColorRef.current.r) +
            Math.abs(currentColorRef.current.g - targetColorRef.current.g) +
            Math.abs(currentColorRef.current.b - targetColorRef.current.b)
        const scaleDistance = currentScaleRef.current.distanceTo(targetScaleRef.current)

        if (colorDistance < 0.01 && scaleDistance < 0.01) {
            currentColorRef.current.copy(targetColorRef.current)
            currentScaleRef.current.copy(targetScaleRef.current)
            materialRef.current.color = currentColorRef.current
            meshRef.current.scale.copy(currentScaleRef.current)
            onSettle()
            return
        }

        currentColorRef.current.lerp(targetColorRef.current, lerpFactor)
        materialRef.current.color.copy(currentColorRef.current)
        currentScaleRef.current.lerp(targetScaleRef.current, lerpFactor)
        meshRef.current.scale.copy(currentScaleRef.current)
    })
    return null
}

export default function LivesDisplay({ levelSize = 4 }: LivesDisplayProps) {
    const props = useControls('Lives Display', {
        position: [0, 0, -3] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        basePosition: [0, 0, 0] as [number, number, number],
        baseScale: [1, 0.2, 0.5] as [number, number, number],
        barPosition: [-0.45, 0.2, 0] as [number, number, number],
        barScale: [0.9, 0.05, 0.3] as [number, number, number],
        animationDuration: { value: 0.3, min: 0.1, max: 2.0, step: 0.1 },
    })

    const materialRef = useRef<MeshStandardMaterial>(null)
    const meshRef = useRef<Mesh>(null)
    const currentColorRef = useRef(new Color(0x22c55e))
    const targetColorRef = useRef(new Color(0x22c55e))
    const currentScaleRef = useRef(new Vector3(...props.barScale))
    const targetScaleRef = useRef(new Vector3(...props.barScale))
    const [isAnimating, setIsAnimating] = useState(false)

    const baseGeometry = useMemo(() => useResource.getState().geometries.get('lifeBar')!, [])
    const baseMaterial = useMemo(() => useResource.getState().materials.get('lifeBar')!, [])

    const barGeometry = useMemo(() => {
        const original = useResource.getState().geometries.get('lifeBar')
        if (!original) return null
        const geometry = original.clone()
        geometry.translate(0.5, 0.15, 0)
        return geometry
    }, [])

    useEffect(() => {
        const unsubscribe = useGame.subscribe(
            (state) => state.lives,
            (value) => {
                targetColorRef.current.setHex(getLifeColor(value))
                targetScaleRef.current.copy(getLifeScale(value, props.barScale))
                setIsAnimating(true)
            }
        )
        return () => unsubscribe()
    }, [props.barScale])

    return (
        <group
            position-x={props.position[0]}
            position-y={props.position[1]}
            position-z={props.position[2] - (levelSize - 4)}
            scale-x={props.scale[0] * levelSize}
            scale-y={props.scale[1]}
            scale-z={props.scale[2]}
        >
            <mesh
                position={props.basePosition}
                scale={props.baseScale}
                geometry={baseGeometry}
                material={baseMaterial}
            />
            <mesh
                ref={meshRef}
                position={props.barPosition}
                scale={currentScaleRef.current}
                geometry={barGeometry ?? undefined}
            >
                <meshStandardMaterial
                    ref={materialRef}
                    color={new Color(getLifeColor(3))}
                />
            </mesh>
            {isAnimating && (
                <LerpFrame
                    materialRef={materialRef}
                    meshRef={meshRef}
                    currentColorRef={currentColorRef}
                    targetColorRef={targetColorRef}
                    currentScaleRef={currentScaleRef}
                    targetScaleRef={targetScaleRef}
                    animationDuration={props.animationDuration}
                    onSettle={() => setIsAnimating(false)}
                />
            )}
        </group>
    )
}
