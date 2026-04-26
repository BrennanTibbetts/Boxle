import { useState } from 'react'
import useGame, { GameMode } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useArcadeRun from '../stores/useArcadeRun'
import useUI from '../stores/useUI'
import StatsModal from './StatsModal'
import RulesModal from './RulesModal'
import DailyPerformanceModal from './DailyPerformanceModal'

function todayString(): string {
    return new Date().toISOString().slice(0, 10)
}

export default function MainMenu() {
    const setMode = useGame((state) => state.setMode)
    const dailySave = usePersistence((state) => state.dailySave)
    const arcadeSave = usePersistence((state) => state.arcadeSave)
    const daily = usePersistence((state) => state.stats.daily)
    const arcade = usePersistence((state) => state.stats.arcade)
    const library = usePersistence((state) => state.stats.library)
    const libraryProgress = usePersistence((state) => state.libraryProgress)
    const startNewArcadeRun = useArcadeRun((state) => state.startNewRun)
    const rulesOpen = useUI((state) => state.rulesOpen)
    const setRulesOpen = useUI((state) => state.setRulesOpen)

    const [showStats, setShowStats] = useState(false)
    const [showPerformance, setShowPerformance] = useState(false)

    const today = todayString()
    const dailyInFlight = dailySave?.date === today && dailySave?.phase !== 'ended'
    const dailyCompleteToday = dailySave?.date === today && dailySave?.phase === 'ended'

    const currentTierSize = libraryProgress.unlockedMaxSize
    const libraryCompletionsThisTier = library.tierCompletions[currentTierSize] ?? 0
    const currentTierProgress = libraryCompletionsThisTier % 10

    const handleDailyClick = () => {
        if (dailyCompleteToday) {
            setShowPerformance(true)
            return
        }
        setMode(GameMode.DAILY)
    }

    return (
        <>
            {showStats && <StatsModal onClose={() => setShowStats(false)} />}
            {showPerformance && <DailyPerformanceModal onClose={() => setShowPerformance(false)} />}
            <RulesModal />
            <div className="menu-overlay">
                <div className="menu-content">
                    <h1 className="menu-title">Boxle</h1>

                    <div className="menu-tiles">
                        <button
                            className={`menu-tile${dailyCompleteToday ? ' menu-tile-done' : ''}`}
                            onClick={handleDailyClick}
                        >
                            <span className="menu-tile-title">Daily</span>
                            {dailyCompleteToday ? (
                                <>
                                    <span className="menu-tile-done-badge">✓ Done for today</span>
                                    <span className="menu-tile-meta">Tap to see result</span>
                                </>
                            ) : (
                                <>
                                    <span className="menu-tile-sub">
                                        {dailyInFlight ? 'Resume' : 'Start'}
                                    </span>
                                    {daily.currentStreak > 0 && (
                                        <span className="menu-tile-meta">🔥 {daily.currentStreak} day streak</span>
                                    )}
                                </>
                            )}
                        </button>

                        <button
                            className={`menu-tile${arcadeSave ? ' menu-tile-resume' : ''}`}
                            onClick={() => setMode(GameMode.ARCADE)}
                        >
                            <span className="menu-tile-title">Arcade</span>
                            {arcadeSave ? (
                                <>
                                    <span className="menu-tile-sub">Resume</span>
                                    <span className="menu-tile-meta">
                                        {arcadeSave.currentSize}×{arcadeSave.currentSize} · {arcadeSave.puzzlesCompleted} cleared
                                    </span>
                                    <button
                                        className="menu-tile-secondary"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            startNewArcadeRun()
                                            setMode(GameMode.ARCADE)
                                        }}
                                    >
                                        New Run
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="menu-tile-sub">Survival</span>
                                    {arcade.deepestSizeEver > 0 && (
                                        <span className="menu-tile-meta">Deepest: {arcade.deepestSizeEver}×{arcade.deepestSizeEver}</span>
                                    )}
                                </>
                            )}
                        </button>

                        <button className="menu-tile" onClick={() => setMode(GameMode.LIBRARY)}>
                            <span className="menu-tile-title">Library</span>
                            <span className="menu-tile-sub">{currentTierSize}×{currentTierSize}</span>
                            <span className="menu-tile-meta">
                                {libraryCompletionsThisTier} completed · {currentTierProgress}/10 in batch
                            </span>
                        </button>
                    </div>

                    <div className="menu-actions">
                        <button className="hud-btn end-btn" onClick={() => setRulesOpen(!rulesOpen)}>
                            How to Play
                        </button>
                        <button className="hud-btn end-btn" onClick={() => setShowStats(true)}>
                            Stats
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
