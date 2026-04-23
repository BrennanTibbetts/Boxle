import { useState } from 'react'
import useGame, { Phase } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import StatsModal from './StatsModal'

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function buildShareGrid(
    levelMistakes: number[],
    levelsCompleted: number,
    levelCount: number,
    isComplete: boolean,
): string {
    return Array.from({ length: levelCount }, (_, i) => {
        if (i < levelsCompleted) return levelMistakes[i] === 0 ? '⭐' : '🟡'
        if (i === levelsCompleted && !isComplete) return '💀'
        return '⬜'
    }).join('')
}

export default function EndScreen() {
    const phase = useGame((state) => state.phase)
    const lives = useGame((state) => state.lives)
    const currentLevel = useGame((state) => state.currentLevel)
    const levelCount = useGame((state) => state.levelConfigs.length)
    const startTime = useGame((state) => state.startTime)
    const endTime = useGame((state) => state.endTime)
    const restart = useGame((state) => state.restart)
    const sessionHints = useGame((state) => state.sessionHints)
    const sessionLivesLost = useGame((state) => state.sessionLivesLost)
    const levelMistakes = useGame((state) => state.levelMistakes)

    const currentStreak = usePersistence((state) => state.currentStreak)

    const [shareLabel, setShareLabel] = useState('Share')
    const [showStats, setShowStats] = useState(false)

    if (phase !== Phase.ENDED) return null

    const isComplete = lives > 0
    const elapsed = startTime && endTime ? endTime - startTime : null
    const levelsCompleted = isComplete ? levelCount : currentLevel - 1

    const shareGrid = buildShareGrid(levelMistakes, levelsCompleted, levelCount, isComplete)
    const dateStr = new Date().toISOString().slice(0, 10)
    const shareText = [
        `Boxle ${dateStr}${isComplete && elapsed ? ` · ${formatTime(elapsed)}` : ''}`,
        shareGrid,
        currentStreak > 0 ? `🔥 ${currentStreak} day streak` : '',
    ].filter(Boolean).join('\n')

    const handleShare = async () => {
        if (navigator.share) {
            navigator.share({ text: shareText }).catch(() => {})
            return
        }
        await navigator.clipboard.writeText(shareText)
        setShareLabel('Copied!')
        setTimeout(() => setShareLabel('Share'), 2000)
    }

    return (
        <>
        {showStats && <StatsModal onClose={() => setShowStats(false)} />}
        <div className="end-screen">
            <div className="end-card">
                <h1 className="end-title">
                    {isComplete ? 'Puzzle Complete' : 'Game Over'}
                </h1>

                <div className="end-share-grid">{shareGrid}</div>

                <div className="end-stats">
                    <div className="end-stat">
                        <span className="end-stat-label">Levels</span>
                        <span className="end-stat-value">{levelsCompleted} / {levelCount}</span>
                    </div>
                    {isComplete && elapsed !== null && (
                        <div className="end-stat">
                            <span className="end-stat-label">Time</span>
                            <span className="end-stat-value">{formatTime(elapsed)}</span>
                        </div>
                    )}
                    {sessionHints > 0 && (
                        <div className="end-stat">
                            <span className="end-stat-label">Hints</span>
                            <span className="end-stat-value">{sessionHints}</span>
                        </div>
                    )}
                    {sessionLivesLost > 0 && (
                        <div className="end-stat">
                            <span className="end-stat-label">Mistakes</span>
                            <span className="end-stat-value">{sessionLivesLost}</span>
                        </div>
                    )}
                </div>

                {currentStreak > 0 && (
                    <p className="end-streak">🔥 {currentStreak} day streak</p>
                )}

                <div className="end-actions">
                    <button className="hud-btn end-btn" onClick={handleShare}>
                        {shareLabel}
                    </button>
                    <button className="hud-btn end-btn" onClick={() => setShowStats(true)}>
                        Stats
                    </button>
                    {isComplete
                        ? <p className="end-sub">See you tomorrow!</p>
                        : <button className="hud-btn end-btn" onClick={restart}>Try Again</button>
                    }
                </div>
            </div>
        </div>
        </>
    )
}
