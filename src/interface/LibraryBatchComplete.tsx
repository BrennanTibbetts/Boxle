import useGame, { GameMode } from '../stores/useGame'
import useLibraryRun from '../stores/useLibraryRun'

export default function LibraryBatchComplete() {
    const setMode = useGame((state) => state.setMode)
    const dismissBatchComplete = useLibraryRun((s) => s.dismissBatchComplete)
    const leaveTier = useLibraryRun((s) => s.leaveTier)
    const activeTierSize = useLibraryRun((s) => s.activeTierSize)

    if (activeTierSize === null) return null

    return (
        <div className="end-screen">
            <div className="end-card">
                <h1 className="end-title">Batch Complete</h1>
                <div className="end-stats">
                    <div className="end-stat">
                        <span className="end-stat-label">Size</span>
                        <span className="end-stat-value">{activeTierSize}×{activeTierSize}</span>
                    </div>
                </div>
                <p className="end-sub">10 puzzles cleared</p>

                <div className="end-actions">
                    <button className="hud-btn end-btn" onClick={() => dismissBatchComplete()}>
                        Another Batch
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
