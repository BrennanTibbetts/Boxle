import { Text } from "@react-three/drei"

const Title = () => {
    return (
        <Text
            font='./bebas.woff'
            position={[0, -0.5, -5]}
            rotation={[-Math.PI * 0.5, 0, 0]}
        >
        Boxle 
        </Text>
    )
}

export default Title