import { useEffect, useState } from 'react'
import { useControls } from 'leva'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js'
import type { ReactNode } from 'react'

import { useResource, COLORS } from '../stores/useResource'

interface ResourceLoaderProps {
    children: ReactNode
}

export default function ResourceLoader({ children }: ResourceLoaderProps) {
    const [resourcesReady, setResourcesReady] = useState(false)
    const { addGeometry, addMaterial, getGroupMaterial, updateGroupMaterials } = useResource()

    const props = useControls('Box', {
        boxSegments: { value: 1, min: 1, max: 10, step: 1 },
        boxRadius: { value: 0.1, min: 0.0, max: 0.5, step: 0.01 },
        boxWireframe: false,
    })

    useEffect(() => {
        const boxGeometry = new RoundedBoxGeometry(1, 1, 1, props.boxSegments, props.boxRadius)
        addGeometry('box', boxGeometry)

        const markMaterial = new THREE.MeshStandardMaterial({ color: '#272729' })
        addMaterial('mark', markMaterial)

        const lifeBarGeometry = new RoundedBoxGeometry(1, 1, 1, props.boxSegments, props.boxRadius)
        addGeometry('lifeBar', lifeBarGeometry)

        const lifeBarMaterial = new THREE.MeshStandardMaterial({ color: '#454b51' })
        addMaterial('lifeBar', lifeBarMaterial)

        for (let i = 0; i < COLORS.length; i++) {
            getGroupMaterial(i, props.boxWireframe)
        }

        setResourcesReady(true)
        return () => { useResource.getState().dispose() }
    }, [props.boxSegments, props.boxRadius, props.boxWireframe, addGeometry, addMaterial, getGroupMaterial])

    useEffect(() => {
        updateGroupMaterials(props.boxWireframe)
    }, [props.boxWireframe, updateGroupMaterials])

    if (!resourcesReady) return <></>

    return <>{children}</>
}
