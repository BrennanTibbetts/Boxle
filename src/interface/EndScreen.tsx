import useGame, { Phase } from '../stores/useGame'

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function EndScreen() {
    const phase = useGame((state) => state.phase)
    const lives = useGame((state) => state.lives)
    const currentLevel = useGame((state) => state.currentLevel)
    const levelCount = useGame((state) => state.levelConfigs.length)
    const startTime = useGame((state) => state.startTime)
    const endTime = useGame((state) => state.endTime)
    const restart = useGame((state) => state.restart)

    if (phase !== Phase.ENDED) return null

    const isComplete = lives > 0
    const elapsed = startTime && endTime ? endTime - startTime : null
    const levelsCompleted = isComplete ? levelCount : currentLevel - 1

    return (
        <div className="end-screen">
            <div className="end-card">
                <h1 className="end-title">
                    {isComplete ? 'Puzzle Complete' : 'Game Over'}
                </h1>

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
                </div>

                {isComplete
                    ? <p className="end-sub">See you tomorrow!</p>
                    : <button className="hud-btn end-btn" onClick={restart}>Try Again</button>
                }
            </div>
        </div>
    )
}
