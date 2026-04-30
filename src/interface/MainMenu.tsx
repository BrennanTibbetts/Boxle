import { useState } from 'react'
import { XStack, YStack } from 'tamagui'
import useGame, { GameMode } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useArcadeRun from '../stores/useArcadeRun'
import StatsModal from './StatsModal'
import DailyPerformanceModal from './DailyPerformanceModal'
import {
    HudButton,
    MenuTile,
    ModalOverlay,
    PageTitle,
} from './ui'

function todayString(): string {
    return new Date().toISOString().slice(0, 10)
}

export default function MainMenu() {
    const setMode = useGame((state) => state.setMode)
    const dailySave = usePersistence((state) => state.dailySave)
    const arcadeSave = usePersistence((state) => state.arcadeSave)
    const daily = usePersistence((state) => state.stats.daily)
    const arcade = usePersistence((state) => state.stats.arcade)
    const library = usePersistence((state) => state.stats.library)
    const libraryProgress = usePersistence((state) => state.libraryProgress)
    const startNewArcadeRun = useArcadeRun((state) => state.startNewRun)

    const [showStats, setShowStats] = useState(false)
    const [showPerformance, setShowPerformance] = useState(false)

    const today = todayString()
    const dailyInFlight = dailySave?.date === today && dailySave?.phase !== 'ended'
    const dailyCompleteToday = dailySave?.date === today && dailySave?.phase === 'ended'

    const currentTierSize = libraryProgress.unlockedMaxSize
    const libraryCompletionsThisTier = library.tierCompletions[currentTierSize] ?? 0
    const currentTierProgress = libraryCompletionsThisTier % 10

    const handleDailyClick = () => {
        if (dailyCompleteToday) {
            setShowPerformance(true)
            return
        }
        setMode(GameMode.DAILY)
    }

    return (
        <>
            {showStats && <StatsModal onClose={() => setShowStats(false)} />}
            {showPerformance && <DailyPerformanceModal onClose={() => setShowPerformance(false)} />}
            <ModalOverlay
                intensity="medium"
                layer="menu"
                scrollable
                $sm={{ alignItems: 'flex-start' }}
            >
                <YStack
                    alignItems="center"
                    gap="$10"
                    padding="$11"
                    width="100%"
                    maxWidth={560}
                    $sm={{ gap: '$6', padding: '$5' }}
                >
                    <PageTitle size="lg" $sm={{ fontSize: 40, letterSpacing: 1.6 }}>
                        Boxle
                    </PageTitle>

                    <XStack
                        gap="$6"
                        flexWrap="wrap"
                        justifyContent="center"
                        $sm={{ gap: '$4', width: '100%' }}
                    >
                        <MenuTile
                            state={dailyCompleteToday ? 'done' : 'default'}
                            onPress={handleDailyClick}
                            $sm={{ width: '100%' }}
                        >
                            <MenuTile.Title>Daily</MenuTile.Title>
                            {dailyCompleteToday ? (
                                <>
                                    <MenuTile.DoneBadge>✓ Done for today</MenuTile.DoneBadge>
                                    <MenuTile.Meta>Tap to see result</MenuTile.Meta>
                                </>
                            ) : (
                                <>
                                    <MenuTile.Sub>{dailyInFlight ? 'Resume' : 'Start'}</MenuTile.Sub>
                                    {daily.currentStreak > 0 && (
                                        <MenuTile.Meta>🔥 {daily.currentStreak} day streak</MenuTile.Meta>
                                    )}
                                </>
                            )}
                        </MenuTile>

                        <MenuTile
                            state={arcadeSave ? 'resume' : 'default'}
                            onPress={() => setMode(GameMode.ARCADE)}
                            $sm={{ width: '100%' }}
                        >
                            <MenuTile.Title>Arcade</MenuTile.Title>
                            {arcadeSave ? (
                                <>
                                    <MenuTile.Sub>Resume</MenuTile.Sub>
                                    <MenuTile.Meta>
                                        {arcadeSave.currentSize}×{arcadeSave.currentSize} · {arcadeSave.puzzlesCompleted} cleared
                                    </MenuTile.Meta>
                                    <HudButton
                                        tone="secondaryChip"
                                        size="md"
                                        alignSelf="stretch"
                                        marginTop="auto"
                                        onPress={(e: any) => {
                                            e?.stopPropagation?.()
                                            startNewArcadeRun()
                                            setMode(GameMode.ARCADE)
                                        }}
                                    >
                                        <HudButton.Text size="md">New Run</HudButton.Text>
                                    </HudButton>
                                </>
                            ) : (
                                <>
                                    <MenuTile.Sub>Survival</MenuTile.Sub>
                                    {arcade.deepestSizeEver > 0 && (
                                        <MenuTile.Meta>
                                            Deepest: {arcade.deepestSizeEver}×{arcade.deepestSizeEver}
                                        </MenuTile.Meta>
                                    )}
                                </>
                            )}
                        </MenuTile>

                        <MenuTile
                            onPress={() => setMode(GameMode.LIBRARY)}
                            $sm={{ width: '100%' }}
                        >
                            <MenuTile.Title>Library</MenuTile.Title>
                            <MenuTile.Sub>{currentTierSize}×{currentTierSize}</MenuTile.Sub>
                            <MenuTile.Meta>
                                {libraryCompletionsThisTier} completed · {currentTierProgress}/10 in batch
                            </MenuTile.Meta>
                        </MenuTile>
                    </XStack>

                    <HudButton onPress={() => setShowStats(true)} size="lg">
                        <HudButton.Text>Stats</HudButton.Text>
                    </HudButton>
                </YStack>
            </ModalOverlay>
        </>
    )
}
