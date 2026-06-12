import { Text } from '@react-three/drei'

// Exported because Display's side-slide math projects the title's plane —
// the slide target must use the same Y the title actually renders at.
export const TITLE_Y = -0.5
const TITLE_Z = -5

export default function Title() {
    return (
        <Text
            font='./boxle/fonts/bebas.woff'
            position={[0, TITLE_Y, TITLE_Z]}
            rotation={[-Math.PI * 0.5, 0, 0]}
        >
            Boxle
        </Text>
    )
}
