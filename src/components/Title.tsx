import { Text } from '@react-three/drei'

export default function Title() {
    return (
        <Text
            font='./boxle/fonts/bebas.woff'
            position={[0, -0.5, -5]}
            rotation={[-Math.PI * 0.5, 0, 0]}
        >
            Boxle
        </Text>
    )
}
