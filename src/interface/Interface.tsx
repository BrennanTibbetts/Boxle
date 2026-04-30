import { useEffect, useLayoutEffect } from 'react'
import { XStack, YStack } from 'tamagui'
import TimerDisplay from '../components/TimerDisplay'
import ControlsManager from './ControlsManager'
import HUD from './HUD'
import HintDescription from './HintDescription'
import EndScreen from './EndScreen'
import MainMenu from './MainMenu'
import AccountButton from './AccountButton'
import AuthModal from './AuthModal'
import RulesModal, { useFirstVisitRules } from './RulesModal'
import { DailyModeProvider } from '../modes/DailyModeProvider'
import { ArcadeModeProvider } from '../modes/ArcadeModeProvider'
import { LibraryModeProvider } from '../modes/LibraryModeProvider'
import useGame, { GameMode, Phase } from '../stores/useGame'
import useArcadeRun from '../stores/useArcadeRun'
import useLibraryRun from '../stores/useLibraryRun'
import usePersistence from '../stores/usePersistence'
import useUI from '../stores/useUI'
import { HudButton } from './ui'

function todayString(): string {
    return new Date().toISOString().slice(0, 10)
}

function useBootMode(): void {
    useLayoutEffect(() => {
        const persistence = usePersistence.getState()
        const today = todayString()
        const dailySave = persistence.dailySave
        const dailyForToday = dailySave?.date === today
        const dailyDoneToday = dailyForToday && dailySave?.phase === Phase.ENDED
        const dailyInFlight = dailyForToday && dailySave?.phase !== Phase.ENDED
        const hasArcadeSave = persistence.arcadeSave !== null
        const lastMode = persistence.lastActiveMode

        // Resume the last active mode if its state is restorable. Falls through
        // to the menu (when there's a finished-daily / lone-arcade-save to
        // choose between) and finally to the daily ritual.
        if (lastMode === 'arcade' && hasArcadeSave) {
            useGame.getState().setMode(GameMode.ARCADE)
            return
        }
        if (lastMode === 'daily' && dailyInFlight) {
            // useGame defaults to DAILY, no setMode needed.
            return
        }
        if (dailyDoneToday || hasArcadeSave) {
            useGame.getState().setMode(GameMode.MENU)
        }
    }, [])
}

function useTrackActiveMode(): void {
    useEffect(() => {
        const apply = (mode: ReturnType<typeof useGame.getState>['activeMode']) => {
            if (mode === GameMode.MENU) return
            usePersistence.getState().setLastActiveMode(mode)
        }
        // Capture the initial mode too — without this, a user who never changes
        // modes won't have lastActiveMode set after the first session.
        apply(useGame.getState().activeMode)
        const unsub = useGame.subscribe((s) => s.activeMode, apply)
        return () => unsub()
    }, [])
}

function PersistentHeader() {
    const activeMode = useGame((s) => s.activeMode)
    const toggleMenu = useGame((s) => s.toggleMenu)
    const rulesOpen = useUI((s) => s.rulesOpen)
    const setRulesOpen = useUI((s) => s.setRulesOpen)

    useFirstVisitRules()

    const onMenu = activeMode === GameMode.MENU

    return (
        <XStack
            position="absolute"
            top={16}
            left={16}
            gap="$2"
            zIndex="$7"
            pointerEvents="auto"
        >
            <HudButton
                tone="account"
                onPress={toggleMenu}
                aria-label={onMenu ? 'Back to game' : 'Open home'}
            >
                <HudButton.Text>Home</HudButton.Text>
            </HudButton>
            <HudButton
                tone="account"
                onPress={() => setRulesOpen(!rulesOpen)}
                aria-label={rulesOpen ? 'Close how to play' : 'How to play'}
            >
                <HudButton.Text>How to Play</HudButton.Text>
            </HudButton>
        </XStack>
    )
}

export default function Interface() {
    useBootMode()
    useTrackActiveMode()
    const activeMode = useGame((state) => state.activeMode)
    const arcadeRunId = useArcadeRun((s) => s.runId)
    const libraryActiveTier = useLibraryRun((s) => s.activeTierSize)
    const libraryShowBatchComplete = useLibraryRun((s) => s.showBatchComplete)
    const libraryShowGameOver = useLibraryRun((s) => s.showGameOver)

    const inLibraryOverlay = activeMode === GameMode.LIBRARY && (
        libraryActiveTier === null || libraryShowBatchComplete || libraryShowGameOver
    )
    const showGameUI = activeMode !== GameMode.MENU && !inLibraryOverlay

    return (
        <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            pointerEvents="box-none"
        >
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

            <PersistentHeader />
            <AccountButton />
            <AuthModal />
            <RulesModal />
        </YStack>
    )
}
