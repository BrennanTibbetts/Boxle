import { useEffect, useState, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useControls } from "leva"
import { useResource } from "../stores/useResource"
import useGame from "../stores/useGame"
import { Color, Vector3 } from "three"
import "../style.css"

export default function LivesDisplay({levelSize = 4}) {
  
  const props = useControls('Lives Display', {
    position: [0, 0, -3],
    scale: [1, 1, 1],
    basePosition: [0, 0, 0],
    baseScale: [1, 0.2, 0.5],
    barPosition: [-0.45, 0.2, 0], 
    barScale: [0.9, 0.05, 0.3],
    animationDuration: {
      value: 0.3,
      min: 0.1,
      max: 2.0,
      step: 0.1,
      label: 'Animation Duration (s)'
    }
  })

  const [lives, setLives] = useState(3)
  const materialRef = useRef()
  const meshRef = useRef()
  const currentColorRef = useRef(new Color(0x22c55e))
  const targetColorRef = useRef(new Color(0x22c55e))
  const currentScaleRef = useRef(new Vector3(props.barScale[0], props.barScale[1], props.barScale[2]))
  const targetScaleRef = useRef(new Vector3(props.barScale[0], props.barScale[1], props.barScale[2]))
  const isAnimatingRef = useRef(false)


  const baseGeometry = useMemo(() => useResource.getState().geometries.get('lifeBar'), [])
  const baseMaterial = useMemo(() => useResource.getState().materials.get('lifeBar'), [])

  const barGeometry = useMemo(() => {
  const originalGeometry = useResource.getState().geometries.get('lifeBar')
    if (originalGeometry) {
      const geometry = originalGeometry.clone()
      geometry.translate(0.5, 0.15, 0)

      return geometry
    }
    return null
  }, [])



  const getLifeColor = (lives) => {
    switch (lives) {
      case 3:
        return 0x22c55e  // green
      case 2:
        return 0xeab308  // yellow
      case 1:
        return 0xef4444  // red
      default:
        return 0xef4444  // red for 0 or invalid values
    }
  }

  const getLifeScale = (lives) => {
    const barScale = new Vector3(props.barScale[0], props.barScale[1], props.barScale[2])
    switch (lives) {
      case 3:
        return barScale
      case 2:
        return barScale.clone().multiply(new Vector3(2/3, 1, 1))
      case 1:
        return barScale.clone().multiply(new Vector3(1/3, 1, 1))
      default:
        return barScale.clone().multiply(new Vector3(0, 1, 1))
    }
  }

  useFrame((_state, delta) => {
    if (!materialRef.current || !isAnimatingRef.current || !meshRef.current) return

    const lerpFactor = delta / props.animationDuration
    
    // Animate color
    const currentR = currentColorRef.current.r
    const currentG = currentColorRef.current.g
    const currentB = currentColorRef.current.b
    const targetR = targetColorRef.current.r
    const targetG = targetColorRef.current.g
    const targetB = targetColorRef.current.b

    const colorDistance = Math.abs(currentR - targetR) + 
                         Math.abs(currentG - targetG) + 
                         Math.abs(currentB - targetB)

    // Animate scale
    const currentScale = currentScaleRef.current
    const targetScale = targetScaleRef.current
    const scaleDistance = currentScale.distanceTo(targetScale)

    if (colorDistance < 0.01 && scaleDistance < 0.01) {
      currentColorRef.current.copy(targetColorRef.current)
      currentScaleRef.current.copy(targetScaleRef.current)
      materialRef.current.color = currentColorRef.current
      meshRef.current.scale.copy(currentScaleRef.current)
      isAnimatingRef.current = false
      return
    }

    // Update color
    currentColorRef.current.lerp(targetColorRef.current, lerpFactor)
    materialRef.current.color.copy(currentColorRef.current)

    // Update scale
    currentScaleRef.current.lerp(targetScale, lerpFactor)
    meshRef.current.scale.copy(currentScaleRef.current)
  })

  useEffect(() => {
    const unsubscribeLives = useGame.subscribe(
      (state) => state.lives,
      (value) => {
        setLives(value)
        targetColorRef.current.setHex(getLifeColor(value))
        targetScaleRef.current.copy(getLifeScale(value))
        isAnimatingRef.current = true
      }
    )

    return () => {
      unsubscribeLives()
    }
  })

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
        geometry={barGeometry}
      >
        <meshStandardMaterial
          ref={materialRef}
          color={new Color(getLifeColor(lives))}
        >
        </meshStandardMaterial>
      </mesh>
    </group>
  )
}