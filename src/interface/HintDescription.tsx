import { Text, View } from 'tamagui'
import useHint from '../stores/useHint'
import type { HintDescription as HintDescriptionTokens } from '../utils/hintRules'
import { useResource, COLORS } from '../stores/useResource'

const COLOR_LABELS: Record<string, string> = {
    gold: 'Yellow',
    mediumpurple: 'Purple',
    mediumaquamarine: 'Aqua',
    lightcoral: 'Red',
    lightyellow: 'White',
    lightgreen: 'Green',
    lightseagreen: 'Teal',
    lightslategray: 'Gray',
    lightsteelblue: 'Light Blue',
    lime: 'Lime',
    cornflowerblue: 'Blue',
}

function TokenDescription({ tokens }: { tokens: HintDescriptionTokens }) {
    const materialOffset = useResource((state) => state.materialOffset)
    return (
        <>
            {tokens.map((token, i) => {
                if (token.type === 'text') {
                    return <Text key={i}>{token.content}</Text>
                }
                if (token.type === 'region') {
                    const color = COLORS[(token.groupId + materialOffset) % COLORS.length]
                    const label = COLOR_LABELS[color] ?? color
                    return (
                        <Text key={i} color={color as any} fontWeight="700">
                            {label}
                        </Text>
                    )
                }
                if (token.type === 'row') {
                    return (
                        <Text key={i} color="$accentInfo" fontWeight="700">
                            this row
                        </Text>
                    )
                }
                if (token.type === 'col') {
                    return (
                        <Text key={i} color="$accentSuccess" fontWeight="700">
                            this column
                        </Text>
                    )
                }
                return null
            })}
        </>
    )
}

export default function HintDescription() {
    const activeHint = useHint((state) => state.activeHint)

    if (!activeHint) return null
    return (
        <View
            position="absolute"
            bottom={80}
            left="50%"
            x="-50%"
            backgroundColor="$bgGlassMid"
            borderColor="$borderMuted"
            borderWidth={1}
            borderRadius="$3"
            paddingHorizontal="$5"
            paddingVertical={7}
            zIndex="$1"
            pointerEvents="none"
            maxWidth="90%"
            $sm={{
                bottom: 78,
                paddingHorizontal: '$3',
                paddingVertical: '$1',
            }}
        >
            <Text
                color="$textMuted"
                fontFamily="$body"
                textAlign="center"
                lineHeight={22}
            >
                <TokenDescription tokens={activeHint.description} />
            </Text>
        </View>
    )
}
