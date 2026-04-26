import useGame, { GameMode } from '../stores/useGame'
import useLibraryRun, { LIBRARY_BATCH_SIZE } from '../stores/useLibraryRun'

export default function LibraryGameOver() {
    const setMode = useGame((state) => state.setMode)
    const restartBatch = useLibraryRun((s) => s.restartBatch)
    const leaveTier = useLibraryRun((s) => s.leaveTier)
    const activeTierSize = useLibraryRun((s) => s.activeTierSize)
    const puzzlesCompletedInTier = useLibraryRun((s) => s.puzzlesCompletedInTier)
    const batchHintsUsed = useLibraryRun((s) => s.batchHintsUsed)
    const batchLivesLost = useLibraryRun((s) => s.batchLivesLost)

    if (activeTierSize === null) return null

    return (
        <div className="end-screen">
            <div className="end-card">
                <h1 className="end-title">Game Over</h1>

                <div className="end-stats">
                    <div className="end-stat">
                        <span className="end-stat-label">Size</span>
                        <span className="end-stat-value">{activeTierSize}×{activeTierSize}</span>
                    </div>
                    <div className="end-stat">
                        <span className="end-stat-label">Cleared</span>
                        <span className="end-stat-value">{puzzlesCompletedInTier} / {LIBRARY_BATCH_SIZE}</span>
                    </div>
                    {batchHintsUsed > 0 && (
                        <div className="end-stat">
                            <span className="end-stat-label">Hints</span>
                            <span className="end-stat-value">{batchHintsUsed}</span>
                        </div>
                    )}
                    {batchLivesLost > 0 && (
                        <div className="end-stat">
                            <span className="end-stat-label">Mistakes</span>
                            <span className="end-stat-value">{batchLivesLost}</span>
                        </div>
                    )}
                </div>

                <p className="end-sub">Batch progress lost. Start over from puzzle 1?</p>

                <div className="end-actions">
                    <button className="hud-btn end-btn" onClick={() => restartBatch()}>
                        Restart Batch
                    </button>
                    <button className="hud-btn end-btn" onClick={() => leaveTier()}>
                        Tier Picker
                    </button>
                    <button className="hud-btn end-btn" onClick={() => setMode(GameMode.MENU)}>
                        Menu
                    </button>
                </div>
            </div>
        </div>
    )
}
