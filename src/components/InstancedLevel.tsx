import { memo, useMemo, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

import { useResource } from '../stores/useResource'
import { boxWorldXZ } from '../hooks/useBoardLayout'

// Static, non-interactive board rendered as one InstancedMesh per region
// color. Used for the receding intro-ladder boards and the upcoming ghosts
// above the play window — nothing is ever placed on those (no useGame.levels
// entry), so per-box React components (each with store subscriptions, GSAP
// effects, and pointer-capable meshes) are pure overhead. This draws the same
// pixels in ~N draw calls per board instead of N², with zero subscriptions
// and zero raycast targets.
//
// Geometry and materials are the same shared singletons Box uses
// (useResource), so the boxes are visually identical to a blank Box.

interface InstancedLevelProps {
    levelMatrix: number[][]
    z: number
    boxSpacing: number
}

interface RegionProps {
    group: number
    boxes: Array<[number, number]>
    gridSize: number
    spacing: number
    geometry: THREE.BufferGeometry
}

function RegionInstances({ group, boxes, gridSize, spacing, geometry }: RegionProps) {
    const material = useMemo(() => useResource.getState().getGroupMaterial(group), [group])
    const ref = useRef<THREE.InstancedMesh>(null)

    useLayoutEffect(() => {
        const mesh = ref.current
        if (!mesh) return
        const m = new THREE.Matrix4()
        boxes.forEach(([r, c], i) => {
            const [x, z] = boxWorldXZ(r, c, gridSize, spacing)
            m.setPosition(x, 0, z)
            mesh.setMatrixAt(i, m)
        })
        mesh.instanceMatrix.needsUpdate = true
        // Default instanced bounds ignore instance transforms — recompute so
        // frustum culling uses the real board extent.
        mesh.computeBoundingSphere()
    }, [boxes, gridSize, spacing])

    return (
        <instancedMesh
            ref={ref}
            args={[geometry, material, boxes.length]}
            receiveShadow
        />
    )
}

const InstancedLevel = memo(({ levelMatrix, z, boxSpacing }: InstancedLevelProps) => {
    const size = levelMatrix.length
    const geometry = useMemo(() => useResource.getState().geometries.get('box')!, [])

    const regions = useMemo(() => {
        const byGroup = new Map<number, Array<[number, number]>>()
        levelMatrix.forEach((row, r) =>
            row.forEach((group, c) => {
                let boxes = byGroup.get(group)
                if (!boxes) {
                    boxes = []
                    byGroup.set(group, boxes)
                }
                boxes.push([r, c])
            })
        )
        return [...byGroup.entries()]
    }, [levelMatrix])

    return (
        <group position={[0, 0, z]}>
            {regions.map(([group, boxes]) => (
                <RegionInstances
                    key={group}
                    group={group}
                    boxes={boxes}
                    gridSize={size}
                    spacing={boxSpacing}
                    geometry={geometry}
                />
            ))}
        </group>
    )
})

export default InstancedLevel
