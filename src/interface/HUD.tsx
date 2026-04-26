import useGame, { GameMode } from '../stores/useGame'
import useHint from '../stores/useHint'
import useUI from '../stores/useUI'
import usePersistence from '../stores/usePersistence'
import { findBestHint } from '../utils/hintRules'
import RulesModal, { useFirstVisitRules } from './RulesModal'

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
    const rulesOpen = useUI((state) => state.rulesOpen)
    const setRulesOpen = useUI((state) => state.setRulesOpen)
    const setMode = useGame((state) => state.setMode)

    useFirstVisitRules()

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
        const game = useGame.getState()
        game.incrementSessionHint()
        if (game.activeMode !== GameMode.MENU) {
            usePersistence.getState().recordHint(game.activeMode)
        }
    }

    return (
        <>
            <div className="hud-corner">
                <button
                    className="hud-btn hud-menu-btn"
                    onClick={() => setMode(GameMode.MENU)}
                    title="Main menu"
                >
                    ☰ Menu
                </button>
            </div>
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
                <div className="hud-section">
                    <button
                        className={`hud-btn hud-rules-btn${rulesOpen ? ' active' : ''}`}
                        onClick={() => setRulesOpen(!rulesOpen)}
                        title={rulesOpen ? 'Close rules' : 'How to play'}
                    >
                        ?
                    </button>
                </div>
            </div>
            <RulesModal />
        </>
    )
}
