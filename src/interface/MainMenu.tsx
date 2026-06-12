import { useState } from 'react'
import { XStack, YStack } from 'tamagui'
import useGame, { GameMode } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useInfiniteRun from '../stores/useInfiniteRun'
import StatsModal from './StatsModal'
import DailyPerformanceModal from './DailyPerformanceModal'
import {
    HudButton,
    MenuTile,
    ModalOverlay,
    PageTitle,
} from './ui'
import { todayISO } from '../utils/date'

export default function MainMenu() {
    const setMode = useGame((state) => state.setMode)
    const dailySave = usePersistence((state) => state.dailySave)
    const infiniteSave = usePersistence((state) => state.infiniteSave)
    const daily = usePersistence((state) => state.stats.daily)
    const infinite = usePersistence((state) => state.stats.infinite)
    const library = usePersistence((state) => state.stats.library)
    const libraryProgress = usePersistence((state) => state.libraryProgress)
    const startNewInfiniteRun = useInfiniteRun((state) => state.startNewRun)

    const [showStats, setShowStats] = useState(false)
    const [showPerformance, setShowPerformance] = useState(false)

    const today = todayISO()
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
                            state={infiniteSave ? 'resume' : 'default'}
                            onPress={() => setMode(GameMode.INFINITE)}
                            $sm={{ width: '100%' }}
                        >
                            <MenuTile.Title>Infinite</MenuTile.Title>
                            {infiniteSave ? (
                                <>
                                    <MenuTile.Sub>Resume</MenuTile.Sub>
                                    <MenuTile.Meta>
                                        {infiniteSave.currentSize}×{infiniteSave.currentSize} · {infiniteSave.puzzlesCompleted} cleared
                                    </MenuTile.Meta>
                                    <HudButton
                                        tone="secondaryChip"
                                        size="md"
                                        alignSelf="stretch"
                                        marginTop="auto"
                                        onPress={(e: any) => {
                                            e?.stopPropagation?.()
                                            startNewInfiniteRun()
                                            setMode(GameMode.INFINITE)
                                        }}
                                    >
                                        <HudButton.Text size="md">New Run</HudButton.Text>
                                    </HudButton>
                                </>
                            ) : (
                                <>
                                    <MenuTile.Sub>Survival</MenuTile.Sub>
                                    {infinite.deepestSizeEver > 0 && (
                                        <MenuTile.Meta>
                                            Deepest: {infinite.deepestSizeEver}×{infinite.deepestSizeEver}
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
