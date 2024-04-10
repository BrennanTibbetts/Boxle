import { RoundedBox, Text } from "@react-three/drei"
import { useRef, useState } from "react"
import gsap from "gsap"


const Instructions = () => {

    const buttonRef = useRef()

    const [instructionsFocused, setInstructionsFocused] = useState(false)

    const pointerEnter = (e) => {
        e.stopPropagation()

        gsap.to(buttonRef.current.scale, {
            y: 0.5,
            duration: 0.5
        })
    }

    const pointerLeave = (e) => {
        e.stopPropagation()

        gsap.to(buttonRef.current.scale, {
            y: 1,
            duration: 0.5
        })
    }

    const instructions = document.getElementById('instructions')
    const exitButton = document.getElementById('exitInstructions')

    exitButton.addEventListener('click', ()=>{
        instructions.style.transform = 'translate(-50%, 100%)'
        setInstructionsFocused(false)
    })

    const focusInstructions = (e) => {
        e.stopPropagation()
        if(instructionsFocused) return
        instructions.style.transform = 'translate(-50%, -50%)'
        setInstructionsFocused(true)
    }

    return <group
        ref={buttonRef}
        position={[0, -0.5, 5]}
        onPointerEnter={pointerEnter}
        onPointerLeave={pointerLeave}
    >
        <RoundedBox 
            args={[5, 0.5, 1]} 
            position={[0, 0, 0]} 
            radius={0.1} 
            smoothness={4} 
            onClick={focusInstructions}
        >
            <meshStandardMaterial color={'#49494b'}/>
            <Text
                font='./bebas.woff'
                rotation={[-Math.PI * 0.5, 0, 0]}
                position={[0, 0.26, 0.05]}
            >
                How To Play
            </Text>
        </RoundedBox>
        <Text
            font='./bebas.woff'
            rotation={[-Math.PI * 0.5, 0, 0]}
        >
            Click
        </Text>
    </group>
}

export default Instructions