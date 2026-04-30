import { useState } from 'react'
import { XStack, YStack, Text } from 'tamagui'
import useGame, { Phase, GameMode } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useArcadeRun from '../stores/useArcadeRun'
import StatsModal from './StatsModal'
import { buildShareGrid, formatTime, shareOrCopy } from '../utils/share'
import {
    BodyText,
    GlassCard,
    HudButton,
    ModalOverlay,
    ModalTitle,
    StatValue,
    SubLabel,
} from './ui'

function StatBlock({ label, value }: { label: string; value: string | number }) {
    return (
        <YStack alignItems="center" gap="$1">
            <SubLabel>{label}</SubLabel>
            <StatValue>{value}</StatValue>
        </YStack>
    )
}

function DailyEndContent() {
    const lives = useGame((state) => state.lives)
    const currentLevel = useGame((state) => state.currentLevel)
    const levelCount = useGame((state) => state.levelConfigs.length)
    const startTime = useGame((state) => state.startTime)
    const endTime = useGame((state) => state.endTime)
    const restart = useGame((state) => state.restart)
    const setMode = useGame((state) => state.setMode)
    const sessionHints = useGame((state) => state.sessionHints)
    const sessionLivesLost = useGame((state) => state.sessionLivesLost)
    const levelMistakes = useGame((state) => state.levelMistakes)
    const currentStreak = usePersistence((state) => state.stats.daily.currentStreak)

    const [shareLabel, setShareLabel] = useState('Share')
    const [showStats, setShowStats] = useState(false)

    const isComplete = lives > 0
    const elapsed = startTime && endTime ? endTime - startTime : null
    const levelsCompleted = isComplete ? levelCount : currentLevel - 1

    const shareGrid = buildShareGrid(levelMistakes, levelsCompleted, levelCount, isComplete)
    const dateStr = new Date().toISOString().slice(0, 10)
    const shareText = [
        `Boxle ${dateStr}${isComplete && elapsed ? ` · ${formatTime(elapsed)}` : ''}`,
        shareGrid,
        currentStreak > 0 ? `🔥 ${currentStreak} day streak` : '',
    ].filter(Boolean).join('\n')

    const handleShare = async () => {
        const result = await shareOrCopy(shareText)
        if (result === 'copied') {
            setShareLabel('Copied!')
            setTimeout(() => setShareLabel('Share'), 2000)
        }
    }

    return (
        <>
            {showStats && <StatsModal onClose={() => setShowStats(false)} />}
            <GlassCard size="lg" minWidth={280} $sm={{ maxWidth: '90%' }}>
                <ModalTitle>{isComplete ? 'Puzzle Complete' : 'Game Over'}</ModalTitle>

                <Text fontFamily="$body" fontSize="$6" letterSpacing={1}>
                    {shareGrid}
                </Text>

                <XStack gap="$9" flexWrap="wrap" justifyContent="center">
                    <StatBlock label="Levels" value={`${levelsCompleted} / ${levelCount}`} />
                    {isComplete && elapsed !== null && (
                        <StatBlock label="Time" value={formatTime(elapsed)} />
                    )}
                    {sessionHints > 0 && (
                        <StatBlock label="Hints" value={sessionHints} />
                    )}
                    {sessionLivesLost > 0 && (
                        <StatBlock label="Mistakes" value={sessionLivesLost} />
                    )}
                </XStack>

                {currentStreak > 0 && (
                    <BodyText tone="muted">🔥 {currentStreak} day streak</BodyText>
                )}

                <XStack gap="$5" flexWrap="wrap" justifyContent="center" alignItems="center">
                    <HudButton onPress={handleShare} size="lg">
                        <HudButton.Text>{shareLabel}</HudButton.Text>
                    </HudButton>
                    <HudButton onPress={() => setShowStats(true)} size="lg">
                        <HudButton.Text>Stats</HudButton.Text>
                    </HudButton>
                    <HudButton onPress={() => setMode(GameMode.MENU)} size="lg">
                        <HudButton.Text>Menu</HudButton.Text>
                    </HudButton>
                    {isComplete ? (
                        <SubLabel>See you tomorrow!</SubLabel>
                    ) : (
                        <HudButton onPress={restart} size="lg">
                            <HudButton.Text>Try Again</HudButton.Text>
                        </HudButton>
                    )}
                </XStack>
            </GlassCard>
        </>
    )
}

function ArcadeEndContent() {
    const setMode = useGame((state) => state.setMode)
    const startNewRun = useArcadeRun((s) => s.startNewRun)
    const currentSize = useArcadeRun((s) => s.currentSize)
    const puzzlesCompleted = useArcadeRun((s) => s.puzzlesCompleted)
    const runHintsUsed = useArcadeRun((s) => s.runHintsUsed)
    const runLivesLost = useArcadeRun((s) => s.runLivesLost)

    return (
        <GlassCard size="lg" minWidth={280} $sm={{ maxWidth: '90%' }}>
            <ModalTitle>Run Ended</ModalTitle>

            <XStack gap="$9" flexWrap="wrap" justifyContent="center">
                <StatBlock label="Deepest" value={`${currentSize}×${currentSize}`} />
                <StatBlock label="Puzzles" value={puzzlesCompleted} />
                {runHintsUsed > 0 && <StatBlock label="Hints" value={runHintsUsed} />}
                {runLivesLost > 0 && <StatBlock label="Mistakes" value={runLivesLost} />}
            </XStack>

            <XStack gap="$5" flexWrap="wrap" justifyContent="center">
                <HudButton onPress={() => startNewRun()} size="lg">
                    <HudButton.Text>New Run</HudButton.Text>
                </HudButton>
                <HudButton onPress={() => setMode(GameMode.MENU)} size="lg">
                    <HudButton.Text>Menu</HudButton.Text>
                </HudButton>
            </XStack>
        </GlassCard>
    )
}

export default function EndScreen() {
    const phase = useGame((state) => state.phase)
    const activeMode = useGame((state) => state.activeMode)

    if (phase !== Phase.ENDED) return null

    return (
        <ModalOverlay layer="game" intensity="light">
            {activeMode === GameMode.ARCADE ? <ArcadeEndContent /> : <DailyEndContent />}
        </ModalOverlay>
    )
}
