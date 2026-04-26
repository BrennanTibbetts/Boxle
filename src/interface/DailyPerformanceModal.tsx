import { useState } from 'react'
import usePersistence from '../stores/usePersistence'
import type { DailyResult } from '../stores/usePersistence'

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function buildShareGrid(result: DailyResult): string {
    const { levelMistakes, levelsCompleted, levelCount, isComplete } = result
    return Array.from({ length: levelCount }, (_, i) => {
        if (i < levelsCompleted) return (levelMistakes[i] ?? 0) === 0 ? '🎯' : '🟡'
        if (i === levelsCompleted && !isComplete) return '💀'
        return '⬜'
    }).join('')
}

export default function DailyPerformanceModal({ onClose }: { onClose: () => void }) {
    const result = usePersistence((s) => s.stats.daily.lastResult)
    const currentStreak = usePersistence((s) => s.stats.daily.currentStreak)
    const [shareLabel, setShareLabel] = useState('Share')

    if (!result) return null

    const shareGrid = buildShareGrid(result)
    const shareText = [
        `Boxle ${result.date}${result.isComplete && result.elapsedMs !== null ? ` · ${formatTime(result.elapsedMs)}` : ''}`,
        shareGrid,
        currentStreak > 0 ? `🔥 ${currentStreak} day streak` : '',
    ].filter(Boolean).join('\n')

    const handleShare = async () => {
        await navigator.clipboard.writeText(shareText)
        setShareLabel('Copied!')
        setTimeout(() => setShareLabel('Share'), 2000)
    }

    return (
        <div className="end-screen" onClick={onClose}>
            <div className="end-card" onClick={(e) => e.stopPropagation()}>
                <h1 className="end-title">
                    {result.isComplete ? "Today's Result" : 'Game Over'}
                </h1>

                <div className="end-share-grid">{shareGrid}</div>

                <div className="end-stats">
                    <div className="end-stat">
                        <span className="end-stat-label">Levels</span>
                        <span className="end-stat-value">{result.levelsCompleted} / {result.levelCount}</span>
                    </div>
                    {result.isComplete && result.elapsedMs !== null && (
                        <div className="end-stat">
                            <span className="end-stat-label">Time</span>
                            <span className="end-stat-value">{formatTime(result.elapsedMs)}</span>
                        </div>
                    )}
                    {result.hintsUsed > 0 && (
                        <div className="end-stat">
                            <span className="end-stat-label">Hints</span>
                            <span className="end-stat-value">{result.hintsUsed}</span>
                        </div>
                    )}
                    {result.livesLost > 0 && (
                        <div className="end-stat">
                            <span className="end-stat-label">Mistakes</span>
                            <span className="end-stat-value">{result.livesLost}</span>
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
                    <button className="hud-btn end-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
                <p className="end-sub">See you tomorrow!</p>
            </div>
        </div>
    )
}
