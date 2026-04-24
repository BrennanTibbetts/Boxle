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
                if (token.type === 'text') return <span key={i}>{token.content}</span>
                if (token.type === 'region') {
                    const color = COLORS[(token.groupId + materialOffset) % COLORS.length]
                    const label = COLOR_LABELS[color] ?? color
                    return <span key={i} style={{ color, fontWeight: 'bold' }}>{label}</span>
                }
                if (token.type === 'row') return <span key={i} style={{ color: '#7dd3fc', fontWeight: 'bold' }}>this row</span>
                if (token.type === 'col') return <span key={i} style={{ color: '#86efac', fontWeight: 'bold' }}>this column</span>
                return null
            })}
        </>
    )
}

export default function HintDescription() {
    const activeHint = useHint((state) => state.activeHint)

    if (!activeHint) return null
    return (
        <div className="hint-description">
            <TokenDescription tokens={activeHint.description} />
        </div>
    )
}
