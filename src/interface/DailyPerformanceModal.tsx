import { useState } from 'react'
import usePersistence from '../stores/usePersistence'
import { buildShareGrid, formatTime, shareOrCopy } from '../utils/share'
import Modal from './Modal'

export default function DailyPerformanceModal({ onClose }: { onClose: () => void }) {
    const result = usePersistence((s) => s.stats.daily.lastResult)
    const currentStreak = usePersistence((s) => s.stats.daily.currentStreak)
    const [shareLabel, setShareLabel] = useState('Share')

    if (!result) return null

    const shareGrid = buildShareGrid(
        result.levelMistakes,
        result.levelsCompleted,
        result.levelCount,
        result.isComplete,
    )
    const shareText = [
        `Boxle ${result.date}${result.isComplete && result.elapsedMs !== null ? ` · ${formatTime(result.elapsedMs)}` : ''}`,
        shareGrid,
        currentStreak > 0 ? `🔥 ${currentStreak} day streak` : '',
    ].filter(Boolean).join('\n')

    const handleShare = async () => {
        const result = await shareOrCopy(shareText)
        if (result === 'copied') {
            setShareLabel('Copied!')
            setTimeout(() => setShareLabel('Share'), 2000)
        }
    }

    return (
        <Modal onClose={onClose} overlayClassName="end-screen" cardClassName="end-card">
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
        </Modal>
    )
}
