import { Html, RoundedBox, Text } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { forwardRef, useRef } from "react"
import gsap from "gsap"


const Instructions = ({focusInstructions, unfocusInstructions}) => {

    const buttonRef = useRef()

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
            <Html>
                Hello There
            </Html>
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