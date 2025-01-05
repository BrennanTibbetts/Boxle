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

  const boxProps = useControls('Box', {
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
    boxWireframe: false
  })

  useEffect(() => {

    // Create and add geometries
    const boxGeometry = new RoundedBoxGeometry(1, 1, 1, boxProps.boxSegments, boxProps.boxRadius)
    addGeometry('box', boxGeometry)
    
    const starGeometry = nodes.star.geometry
    addGeometry('star', starGeometry)

    const markMaterial = new THREE.MeshStandardMaterial({color: '#272729'})
    addMaterial('mark', markMaterial)

    // Pre-create group materials
    for (let i = 0; i < COLORS.length; i++) {
      getGroupMaterial(i, boxProps.boxWireframe)
    }

    setResourcesReady(true)
    return () => {
      useResource.getState().dispose()
    }
  }, [boxProps.boxSegments, boxProps.boxRadius, boxProps.boxWireframe, addGeometry, nodes.star.geometry, addMaterial, getGroupMaterial])

  // Update materials when wireframe setting changes
  useEffect(() => {
    updateGroupMaterials(boxProps.boxWireframe)
  }, [boxProps.boxWireframe, updateGroupMaterials])

  if (!resourcesReady) {
    return <></>
  }

  return <>{children}</>
}

useGLTF.preload('https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/star/model.gltf')
export default ResourceLoader