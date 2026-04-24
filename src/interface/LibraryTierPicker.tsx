import useGame, { GameMode } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useLibraryRun, { LIBRARY_MIN_SIZE, LIBRARY_MAX_SIZE, LIBRARY_BATCH_SIZE } from '../stores/useLibraryRun'
import { canPlayAt } from '../utils/gates'

export default function LibraryTierPicker() {
    const setMode = useGame((state) => state.setMode)
    const enterTier = useLibraryRun((s) => s.enterTier)
    const libraryProgress = usePersistence((state) => state.libraryProgress)
    const tierCompletions = usePersistence((state) => state.stats.library.tierCompletions)

    const sizes: number[] = []
    for (let n = LIBRARY_MIN_SIZE; n <= LIBRARY_MAX_SIZE; n++) sizes.push(n)

    return (
        <div className="menu-overlay">
            <div className="menu-content">
                <h1 className="menu-title">Library</h1>

                <div className="library-tier-grid">
                    {sizes.map((size) => {
                        const unlocked = size <= libraryProgress.unlockedMaxSize
                        const allowed = canPlayAt(size, GameMode.LIBRARY)
                        const playable = unlocked && allowed
                        const completionsHere = tierCompletions[size] ?? 0
                        const batchesHere = Math.floor(completionsHere / LIBRARY_BATCH_SIZE)
                        const inProgress = completionsHere - batchesHere * LIBRARY_BATCH_SIZE

                        return (
                            <button
                                key={size}
                                className="library-tier-card"
                                disabled={!playable}
                                onClick={() => playable && enterTier(size)}
                            >
                                <span className="library-tier-size">{size}×{size}</span>
                                {unlocked ? (
                                    <>
                                        <span className="library-tier-batches">{batchesHere} batches</span>
                                        <span className="library-tier-progress">{inProgress}/{LIBRARY_BATCH_SIZE}</span>
                                    </>
                                ) : (
                                    <span className="library-tier-locked">Locked</span>
                                )}
                            </button>
                        )
                    })}
                </div>

                <div className="menu-actions">
                    <button className="hud-btn end-btn" onClick={() => setMode(GameMode.MENU)}>
                        Back to Menu
                    </button>
                </div>
            </div>
        </div>
    )
}
