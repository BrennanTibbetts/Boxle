import { useLayoutEffect } from 'react'
import TimerDisplay from '../components/TimerDisplay'
import ControlsManager from './ControlsManager'
import HUD from './HUD'
import HintDescription from './HintDescription'
import EndScreen from './EndScreen'
import MainMenu from './MainMenu'
import { DailyModeProvider } from '../modes/DailyModeProvider'
import { ArcadeModeProvider } from '../modes/ArcadeModeProvider'
import { LibraryModeProvider } from '../modes/LibraryModeProvider'
import useGame, { GameMode, Phase } from '../stores/useGame'
import useArcadeRun from '../stores/useArcadeRun'
import useLibraryRun from '../stores/useLibraryRun'
import usePersistence from '../stores/usePersistence'

function todayString(): string {
    return new Date().toISOString().slice(0, 10)
}

function useBootMode(): void {
    useLayoutEffect(() => {
        const save = usePersistence.getState().dailySave
        if (save && save.date === todayString() && save.phase === Phase.ENDED) {
            useGame.getState().setMode(GameMode.MENU)
        }
    }, [])
}

export default function Interface() {
    useBootMode()
    const activeMode = useGame((state) => state.activeMode)
    const arcadeRunId = useArcadeRun((s) => s.runId)
    const libraryActiveTier = useLibraryRun((s) => s.activeTierSize)
    const libraryShowBatchComplete = useLibraryRun((s) => s.showBatchComplete)

    const inLibraryPicker = activeMode === GameMode.LIBRARY && (libraryActiveTier === null || libraryShowBatchComplete)
    const showGameUI = activeMode !== GameMode.MENU && !inLibraryPicker

    return (
        <div className='interface'>
            {activeMode === GameMode.DAILY && <DailyModeProvider />}
            {activeMode === GameMode.ARCADE && <ArcadeModeProvider key={arcadeRunId} />}
            {activeMode === GameMode.LIBRARY && <LibraryModeProvider />}

            {showGameUI && (
                <>
                    <HUD />
                    <TimerDisplay />
                    <EndScreen />
                    <HintDescription />
                    <ControlsManager />
                </>
            )}

            {activeMode === GameMode.MENU && <MainMenu />}
        </div>
    )
}
