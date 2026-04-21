import { RoundedBox, Text } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'
import gsap from 'gsap'

export default function TutorialButton() {
    const [instructionsFocused, setInstructionsFocused] = useState(false)
    const buttonRef = useRef<Group>(null)

    useEffect(() => {
        const instructions = document.getElementById('instructions')
        const exitButton = document.getElementById('exitInstructions')
        if (!exitButton || !instructions) return

        const handleExit = () => {
            instructions.style.transform = 'translate(-50%, 100%)'
            setInstructionsFocused(false)
        }
        exitButton.addEventListener('click', handleExit)
        return () => exitButton.removeEventListener('click', handleExit)
    }, [])

    const handlePointerEnter = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        if (buttonRef.current) gsap.to(buttonRef.current.scale, { x: 0.9, y: 0.9, z: 0.9, duration: 0.5 })
    }

    const handlePointerLeave = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        if (buttonRef.current) gsap.to(buttonRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.5 })
    }

    const focusInstructions = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (instructionsFocused) return
        const instructions = document.getElementById('instructions')
        if (instructions) instructions.style.transform = 'translate(-50%, -50%)'
        setInstructionsFocused(true)
    }

    return (
        <group ref={buttonRef} position={[0, -0.5, 5]} onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
            <RoundedBox args={[5, 0.5, 1]} radius={0.1} smoothness={4} onClick={focusInstructions}>
                <meshStandardMaterial color='#49494b' />
                <Text
                    font='./boxle/fonts/bebas.woff'
                    rotation={[-Math.PI * 0.5, 0, 0]}
                    position={[0, 0.26, 0.05]}
                >
                    TUTORIAL
                </Text>
            </RoundedBox>
            <Text font='./boxle/fonts/bebas.woff' rotation={[-Math.PI * 0.5, 0, 0]}>
                Click
            </Text>
        </group>
    )
}
