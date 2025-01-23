import { useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/Addons.js'

import { useResource, COLORS } from '../stores/useResource'

const ResourceLoader = ({ children }) => {
  const [resourcesReady, setResourcesReady] = useState(false)

  const { addGeometry, addMaterial, getGroupMaterial, updateGroupMaterials } = useResource()
  const { nodes } = useGLTF('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/star/model.gltf')

  const props = useControls('Box', {
    boxSegments: {
      value: 1,
      min: 1,
      max: 10,
      step: 1
    },
    boxRadius: {
      value: 0.1,
      min: 0.0,
      max: 0.5,
      step: 0.01
    },
    boxWireframe: false,
    lifeBarBaseSegments: 2,
    lifeBarBaseRadius: 0.025
  })

  useEffect(() => {

    // Create and add geometries
    const boxGeometry = new RoundedBoxGeometry(1, 1, 1, props.boxSegments, props.boxRadius)
    addGeometry('box', boxGeometry)
    
    const starGeometry = nodes.star.geometry
    addGeometry('star', starGeometry)

    const markMaterial = new THREE.MeshStandardMaterial({color: '#272729'})
    addMaterial('mark', markMaterial)

    const lifeBarGeometry = new RoundedBoxGeometry(1, 1, 1, props.boxSegments, props.boxRadius)
    addGeometry('lifeBar', lifeBarGeometry)

    const lifeBarMaterial = new THREE.MeshStandardMaterial({color: '#454b51'})
    addMaterial('lifeBar', lifeBarMaterial)

    // Pre-create group materials
    for (let i = 0; i < COLORS.length; i++) {
      getGroupMaterial(i, props.boxWireframe)
    }

    setResourcesReady(true)
    return () => {
      useResource.getState().dispose()
    }
  }, [props.boxSegments, props.boxRadius, props.boxWireframe, addGeometry, nodes.star.geometry, addMaterial, getGroupMaterial])

  // Update materials when wireframe setting changes
  useEffect(() => {
    updateGroupMaterials(props.boxWireframe)
  }, [props.boxWireframe, updateGroupMaterials])

  if (!resourcesReady) {
    return <></>
  }

  return <>{children}</>
}

useGLTF.preload('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/star/model.gltf')
export default ResourceLoader