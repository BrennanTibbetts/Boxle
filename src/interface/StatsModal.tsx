import { useState } from 'react'
import usePersistence from '../stores/usePersistence'

type StatsTab = 'daily' | 'arcade' | 'library'

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function StatItem({ value, label }: { value: string | number; label: string }) {
    return (
        <div className="stats-item">
            <span className="stats-value">{value}</span>
            <span className="stats-label">{label}</span>
        </div>
    )
}

function DailyStats() {
    const daily = usePersistence((s) => s.stats.daily)
    const winRate = daily.sessionsPlayed > 0
        ? Math.round((daily.sessionsCompleted / daily.sessionsPlayed) * 100)
        : 0

    return (
        <>
            <div className="stats-section">
                <div className="stats-row">
                    <StatItem
                        value={daily.currentStreak > 0 ? `🔥 ${daily.currentStreak}` : daily.currentStreak}
                        label="Streak"
                    />
                    <StatItem value={daily.longestStreak} label="Best Streak" />
                </div>
            </div>
            <div className="stats-section">
                <div className="stats-row">
                    <StatItem value={daily.sessionsPlayed} label="Played" />
                    <StatItem value={daily.sessionsCompleted} label="Completed" />
                    <StatItem value={`${winRate}%`} label="Win Rate" />
                </div>
            </div>
            <div className="stats-section">
                <div className="stats-row">
                    {daily.bestTimeMs !== null && (
                        <StatItem value={formatTime(daily.bestTimeMs)} label="Best Time" />
                    )}
                    <StatItem value={daily.hintsUsed} label="Hints" />
                    <StatItem value={daily.livesLost} label="Mistakes" />
                </div>
            </div>
        </>
    )
}

function ArcadeStats() {
    const arcade = usePersistence((s) => s.stats.arcade)
    return (
        <>
            <div className="stats-section">
                <div className="stats-row">
                    <StatItem
                        value={arcade.deepestSizeEver > 0 ? `${arcade.deepestSizeEver}×${arcade.deepestSizeEver}` : '—'}
                        label="Deepest"
                    />
                </div>
            </div>
            <div className="stats-section">
                <div className="stats-row">
                    <StatItem value={arcade.runsPlayed} label="Runs" />
                    <StatItem value={arcade.runsCompleted} label="Cleared" />
                </div>
            </div>
            <div className="stats-section">
                <div className="stats-row">
                    <StatItem value={arcade.hintsUsed} label="Hints" />
                    <StatItem value={arcade.livesLost} label="Mistakes" />
                </div>
            </div>
        </>
    )
}

function LibraryStats() {
    const library = usePersistence((s) => s.stats.library)
    const sizes = Object.keys(library.tierCompletions).map(Number).sort((a, b) => a - b)
    const totalCompleted = sizes.reduce((sum, s) => sum + (library.tierCompletions[s] ?? 0), 0)

    return (
        <>
            <div className="stats-section">
                <div className="stats-row">
                    <StatItem value={totalCompleted} label="Total Completed" />
                </div>
            </div>
            {sizes.length > 0 && (
                <div className="stats-section">
                    <div className="stats-tier-list">
                        {sizes.map((size) => (
                            <div key={size} className="stats-tier-row">
                                <span className="stats-tier-size">{size}×{size}</span>
                                <span className="stats-tier-count">{library.tierCompletions[size]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="stats-section">
                <div className="stats-row">
                    <StatItem value={library.hintsUsed} label="Hints" />
                    <StatItem value={library.livesLost} label="Mistakes" />
                </div>
            </div>
        </>
    )
}

export default function StatsModal({ onClose }: { onClose: () => void }) {
    const [tab, setTab] = useState<StatsTab>('daily')

    return (
        <div className="stats-overlay" onClick={onClose}>
            <div className="stats-card" onClick={(e) => e.stopPropagation()}>
                <h2 className="stats-title">Stats</h2>

                <div className="stats-tabs">
                    <button
                        className={`stats-tab${tab === 'daily' ? ' active' : ''}`}
                        onClick={() => setTab('daily')}
                    >Daily</button>
                    <button
                        className={`stats-tab${tab === 'arcade' ? ' active' : ''}`}
                        onClick={() => setTab('arcade')}
                    >Arcade</button>
                    <button
                        className={`stats-tab${tab === 'library' ? ' active' : ''}`}
                        onClick={() => setTab('library')}
                    >Library</button>
                </div>

                {tab === 'daily' && <DailyStats />}
                {tab === 'arcade' && <ArcadeStats />}
                {tab === 'library' && <LibraryStats />}

                <button className="hud-btn end-btn" onClick={onClose}>Close</button>
            </div>
        </div>
    )
}
