import usePersistence from '../stores/usePersistence'

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function StatsModal({ onClose }: { onClose: () => void }) {
    const totalSessions = usePersistence((s) => s.totalSessions)
    const totalCompleted = usePersistence((s) => s.totalCompleted)
    const bestTimeMs = usePersistence((s) => s.bestTimeMs)
    const totalHints = usePersistence((s) => s.totalHints)
    const totalMistakes = usePersistence((s) => s.totalMistakes)
    const currentStreak = usePersistence((s) => s.currentStreak)
    const longestStreak = usePersistence((s) => s.longestStreak)

    const winRate = totalSessions > 0 ? Math.round((totalCompleted / totalSessions) * 100) : 0

    return (
        <div className="stats-overlay" onClick={onClose}>
            <div className="stats-card" onClick={(e) => e.stopPropagation()}>
                <h2 className="stats-title">Stats</h2>

                <div className="stats-section">
                    <div className="stats-row">
                        <div className="stats-item">
                            <span className="stats-value">{currentStreak > 0 ? `🔥 ${currentStreak}` : currentStreak}</span>
                            <span className="stats-label">Streak</span>
                        </div>
                        <div className="stats-item">
                            <span className="stats-value">{longestStreak}</span>
                            <span className="stats-label">Best Streak</span>
                        </div>
                    </div>
                </div>

                <div className="stats-section">
                    <div className="stats-row">
                        <div className="stats-item">
                            <span className="stats-value">{totalSessions}</span>
                            <span className="stats-label">Played</span>
                        </div>
                        <div className="stats-item">
                            <span className="stats-value">{totalCompleted}</span>
                            <span className="stats-label">Completed</span>
                        </div>
                        <div className="stats-item">
                            <span className="stats-value">{winRate}%</span>
                            <span className="stats-label">Win Rate</span>
                        </div>
                    </div>
                </div>

                <div className="stats-section">
                    <div className="stats-row">
                        {bestTimeMs !== null && (
                            <div className="stats-item">
                                <span className="stats-value">{formatTime(bestTimeMs)}</span>
                                <span className="stats-label">Best Time</span>
                            </div>
                        )}
                        <div className="stats-item">
                            <span className="stats-value">{totalHints}</span>
                            <span className="stats-label">Hints</span>
                        </div>
                        <div className="stats-item">
                            <span className="stats-value">{totalMistakes}</span>
                            <span className="stats-label">Mistakes</span>
                        </div>
                    </div>
                </div>

                <button className="hud-btn end-btn" onClick={onClose}>Close</button>
            </div>
        </div>
    )
}
