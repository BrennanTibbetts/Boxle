import useGame from '../stores/useGame'
import useHint from '../stores/useHint'
import { findBestHint } from '../utils/hintRules'
import type { HintDescription } from '../utils/hintRules'
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

function Description({ tokens }: { tokens: HintDescription }) {
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

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg viewBox="0 0 24 24" className={`hud-heart ${filled ? 'filled' : 'empty'}`}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
    )
}

export default function HUD() {
    const lives = useGame((state) => state.lives)
    const currentLevel = useGame((state) => state.currentLevel)
    const clearMarks = useGame((state) => state.clearMarks)
    const levels = useGame((state) => state.levels)
    const levelConfigs = useGame((state) => state.levelConfigs)
    const activeHint = useHint((state) => state.activeHint)
    const setHint = useHint((state) => state.setHint)
    const clearHint = useHint((state) => state.clearHint)

    const handleHint = () => {
        if (activeHint) {
            clearHint()
            return
        }
        const levelIndex = currentLevel - 1
        const config = levelConfigs[levelIndex]
        const grid = levels[levelIndex]
        if (!config || !grid) return
        const result = findBestHint(levelIndex, config.levelMatrix, grid)
        setHint(result)
    }

    return (
        <>
        {activeHint && (
            <div className="hint-description">
                <Description tokens={activeHint.description} />
            </div>
        )}
        <div className="hud">
            <div className="hud-section hud-level">
                <span className="hud-label">Level</span>
                <span className="hud-value">{currentLevel}</span>
            </div>
            <div className="hud-section hud-lives">
                {[1, 2, 3].map((i) => (
                    <HeartIcon key={i} filled={lives >= i} />
                ))}
            </div>
            <div className="hud-section">
                <button className="hud-btn" onClick={() => clearMarks(currentLevel - 1)}>
                    Clear Marks
                </button>
            </div>
            <div className="hud-section">
                <button
                    className={`hud-btn hud-hint-btn${activeHint ? ' active' : ''}`}
                    onClick={handleHint}
                    title={activeHint ? 'Dismiss hint' : 'Show hint'}
                >
                    💡
                </button>
            </div>
        </div>
        </>
    )
}
