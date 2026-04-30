import { Text, XStack } from 'tamagui'
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
                    return (
                        <Text key={i} color="$textMuted" fontFamily="$body">
                            {token.content}
                        </Text>
                    )
                }
                if (token.type === 'region') {
                    const color = COLORS[(token.groupId + materialOffset) % COLORS.length]
                    const label = COLOR_LABELS[color] ?? color
                    return (
                        <Text
                            key={i}
                            color={color as any}
                            fontWeight="700"
                            fontFamily="$body"
                        >
                            {label}
                        </Text>
                    )
                }
                if (token.type === 'row') {
                    return (
                        <Text key={i} color="$accentInfo" fontWeight="700" fontFamily="$body">
                            this row
                        </Text>
                    )
                }
                if (token.type === 'col') {
                    return (
                        <Text key={i} color="$accentSuccess" fontWeight="700" fontFamily="$body">
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
        <XStack
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
            gap={4}
            alignItems="center"
            $sm={{
                bottom: 78,
                paddingHorizontal: '$3',
                paddingVertical: '$1',
                maxWidth: '90%',
                flexWrap: 'wrap',
                justifyContent: 'center',
            }}
        >
            <TokenDescription tokens={activeHint.description} />
        </XStack>
    )
}
