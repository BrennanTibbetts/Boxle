// CONFETTI COMPONENT BY ANDERSON MANCINI AND ROMAIN HERAULT
// Based on: https://github.com/JamesChan21/threejs-confetti
// Based on: https://github.com/daniel-lundin/dom-confetti

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ConfettiProps {
    isExploding?: boolean
    amount?: number
    rate?: number
    radius?: number
    areaWidth?: number
    areaHeight?: number
    fallingHeight?: number
    fallingSpeed?: number
    colors?: string[]
    enableShadows?: boolean
}

export default function ExplosionConfetti({
    isExploding = false,
    amount = 100,
    rate = 3,
    radius = 15,
    areaWidth = 3,
    areaHeight = 1,
    fallingHeight = 10,
    fallingSpeed = 8,
    colors = ['#0000ff', '#ff0000', '#ffff00'],
    enableShadows = false,
}: ConfettiProps) {
    const groupRef = useRef<THREE.Mesh>(null)
    const [booms] = useState<THREE.Object3D[]>([])

    const spawnRate = rate / 100
    const geometry = new THREE.PlaneGeometry(0.03, 0.03, 1, 1)

    function explode() {
        if (!groupRef.current) return
        const boom = new THREE.Object3D() as THREE.Object3D & {
            life: number
            dispose: () => void
        }
        boom.life = Math.random() * 5 + 5
        boom.position.x = -(areaWidth / 2) + areaWidth * Math.random()
        boom.position.y = fallingHeight + areaHeight - fallingSpeed
        boom.position.z = -(areaWidth / 2) + areaWidth * Math.random()
        groupRef.current.add(boom)
        booms.push(boom)

        for (let i = 0; i < amount; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                side: THREE.DoubleSide,
            })
            const particle = new THREE.Mesh(geometry, material) as unknown as THREE.Mesh & {
                life: number
                destination: { x: number; y: number; z: number }
                rotateSpeedX: number
                rotateSpeedY: number
                rotateSpeedZ: number
            }
            particle.castShadow = enableShadows
            boom.add(particle)
            particle.life = 1
            particle.destination = {
                x: (Math.random() - 0.5) * (radius * 2) * Math.random(),
                y: (Math.random() - 0.5) * (radius * 2) * Math.random(),
                z: (Math.random() - 0.5) * (radius * 2) * Math.random(),
            }
            particle.rotation.x = Math.random() * 360
            particle.rotation.y = Math.random() * 360
            particle.rotation.z = Math.random() * 360
            const size = Math.random() * 2 + 1
            particle.scale.set(size, size, size)
            particle.rotateSpeedX = Math.random() * 0.8 - 0.4
            particle.rotateSpeedY = Math.random() * 0.8 - 0.4
            particle.rotateSpeedZ = Math.random() * 0.8 - 0.4
        }

        boom.dispose = () => {
            for (let i = boom.children.length - 1; i >= 0; i--) {
                const particle = boom.children[i] as THREE.Mesh
                particle.material instanceof THREE.Material && particle.material.dispose()
                particle.geometry.dispose()
                boom.remove(particle)
            }
            groupRef.current?.remove(boom)
        }
    }

    useFrame(() => {
        if (isExploding && Math.random() < spawnRate) explode()

        for (let i = booms.length - 1; i >= 0; i--) {
            const boom = booms[i] as THREE.Object3D & { life: number; dispose: () => void }

            for (let k = boom.children.length - 1; k >= 0; k--) {
                const particle = boom.children[k] as THREE.Mesh & {
                    life: number
                    destination: { x: number; y: number; z: number }
                    rotateSpeedX: number
                    rotateSpeedY: number
                    rotateSpeedZ: number
                }
                const mat = particle.material as THREE.MeshBasicMaterial

                particle.destination.y -= THREE.MathUtils.randFloat(0.1, 0.3)
                particle.life -= THREE.MathUtils.randFloat(0.005, 0.01)

                particle.position.x += (particle.destination.x - particle.position.x) / 200
                particle.position.y += (particle.destination.y - particle.position.y) / 200
                particle.position.z += (particle.destination.z - particle.position.z) / 200

                particle.rotation.y += particle.rotateSpeedY
                particle.rotation.x += particle.rotateSpeedX
                particle.rotation.z += particle.rotateSpeedZ

                mat.opacity -= THREE.MathUtils.randFloat(0.005, 0.01)

                if (particle.position.y < -fallingHeight) {
                    mat.dispose()
                    particle.geometry.dispose()
                    boom.remove(particle)
                }
            }

            if (boom.children.length <= 0) {
                boom.dispose()
                booms.splice(i, 1)
            }
        }
    })

    return <mesh ref={groupRef} />
}
