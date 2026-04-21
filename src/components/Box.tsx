import gsap from 'gsap'
import { useRef, useMemo, useEffect } from 'react'
import type { ThreeEvent } from '@react-three/fiber'

import { useResource } from '../stores/useResource'
import useButtonAnimation from '../utils/useButtonAnimation'
import useGame, { BoxState } from '../stores/useGame'
import type { BoxStateValue } from '../stores/useGame'

interface BoxProps {
    group: number
    levelIndex: number
    row: number
    col: number
    gridSize: number
    spacing: number
    interactive?: boolean
}

const STATE_ROTATION: Record<BoxStateValue, number> = {
    [BoxState.BLANK]: 0,
    [BoxState.MARK]: Math.PI / 2,
    [BoxState.LOCK]: -Math.PI / 2,
    [BoxState.STAR]: Math.PI,
}

export default function Box({ group, levelIndex, row, col, gridSize, spacing, interactive = true }: BoxProps) {
    const boxState = useGame((state) => state.levels[levelIndex]?.[row]?.[col] ?? BoxState.BLANK)
    const placeStar = useGame((state) => state.placeStar)
    const toggleMark = useGame((state) => state.toggleMark)

    const geometry = useMemo(() => useResource.getState().geometries.get('box')!, [])
    const starGeometry = useMemo(() => useResource.getState().geometries.get('star')!, [])
    const markMaterial = useMemo(() => useResource.getState().materials.get('mark')!, [])
    const material = useMemo(() => useResource.getState().getGroupMaterial(group), [group])

    const { ref: box, enter: pointerEnter, leave: pointerLeave } = useButtonAnimation()

    useEffect(() => {
        if (!box.current) return
        gsap.to(box.current.rotation, { x: STATE_ROTATION[boxState], duration: 0.25 })
    }, [boxState])

    const position: [number, number, number] = [
        ((col - gridSize / 2) + 0.5) * spacing,
        0,
        ((row - gridSize / 2) + 0.5) * spacing,
    ]

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        if (!interactive) return
        e.stopPropagation()
        if (boxState === BoxState.BLANK || boxState === BoxState.MARK) {
            toggleMark(levelIndex, row, col)
        }
    }

    const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
        if (!interactive) return
        e.stopPropagation()
        e.nativeEvent.preventDefault()
        if (boxState === BoxState.BLANK || boxState === BoxState.MARK) {
            placeStar(levelIndex, row, col)
        }
    }

    return (
        <group position={position} ref={box}>
            <mesh
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleDoubleClick}
                onPointerEnter={pointerEnter}
                onPointerLeave={pointerLeave}
                castShadow
                receiveShadow
                geometry={geometry}
                material={material}
            />
            <mesh
                material={markMaterial}
                position-y={-0.5}
                rotation-x={-Math.PI / 2}
                scale={0.6}
            >
                <primitive object={starGeometry} />
            </mesh>
            <mesh
                scale={[0.3, 0.3, 0.1]}
                position-z={-0.5}
                castShadow
                receiveShadow
                geometry={geometry}
                material={markMaterial}
            />
            <mesh
                scale={[0.4, 0.4, 0.2]}
                position-z={0.5}
                castShadow
                receiveShadow
                geometry={geometry}
                material={markMaterial}
            />
        </group>
    )
}
