import { useEffect, useRef, useState } from 'react'
import { XStack, YStack } from 'tamagui'
import usePersistence from '../stores/usePersistence'
import { buildShareGrid, formatTime, shareOrCopy } from '../utils/share'
import Modal from './Modal'
import { CompletionRow } from './EndScreen'
import { HudButton, ModalTitle, StatValue, SubLabel, BodyText } from './ui'

export default function DailyPerformanceModal({ onClose }: { onClose: () => void }) {
    const result = usePersistence((s) => s.stats.daily.lastResult)
    const currentStreak = usePersistence((s) => s.stats.daily.currentStreak)
    const [shareLabel, setShareLabel] = useState('Share')
    // Cleared on unmount so the label reset can't setState after the modal closes
    const shareResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => () => { if (shareResetTimer.current) clearTimeout(shareResetTimer.current) }, [])

    if (!result) return null

    const shareGrid = buildShareGrid(
        result.levelMistakes,
        result.levelsCompleted,
        result.levelCount,
        result.isComplete,
    )
    const shareText = [
        `Boxle ${result.date}${result.isComplete && result.elapsedMs !== null ? ` · ${formatTime(result.elapsedMs)}` : ''}`,
        shareGrid,
        currentStreak > 0 ? `🔥 ${currentStreak} day streak` : '',
    ].filter(Boolean).join('\n')

    const handleShare = async () => {
        const result = await shareOrCopy(shareText)
        if (result === 'copied') {
            setShareLabel('Copied!')
            if (shareResetTimer.current) clearTimeout(shareResetTimer.current)
            shareResetTimer.current = setTimeout(() => setShareLabel('Share'), 2000)
        }
    }

    return (
        <Modal
            onClose={onClose}
            overlayProps={{ intensity: 'light', layer: 'game' }}
            cardProps={{ size: 'lg', minWidth: 280 }}
        >
            <ModalTitle>{result.isComplete ? "Today's Result" : 'Game Over'}</ModalTitle>

            <CompletionRow
                levelsCompleted={result.levelsCompleted}
                levelCount={result.levelCount}
                isComplete={result.isComplete}
            />

            <XStack gap="$9" flexWrap="wrap" justifyContent="center">
                <YStack alignItems="center" gap="$1">
                    <SubLabel>Levels</SubLabel>
                    <StatValue>{result.levelsCompleted} / {result.levelCount}</StatValue>
                </YStack>
                {result.isComplete && result.elapsedMs !== null && (
                    <YStack alignItems="center" gap="$1">
                        <SubLabel>Time</SubLabel>
                        <StatValue>{formatTime(result.elapsedMs)}</StatValue>
                    </YStack>
                )}
                {result.hintsUsed > 0 && (
                    <YStack alignItems="center" gap="$1">
                        <SubLabel>Hints</SubLabel>
                        <StatValue>{result.hintsUsed}</StatValue>
                    </YStack>
                )}
                {result.livesLost > 0 && (
                    <YStack alignItems="center" gap="$1">
                        <SubLabel>Mistakes</SubLabel>
                        <StatValue>{result.livesLost}</StatValue>
                    </YStack>
                )}
            </XStack>

            {currentStreak > 0 && (
                <BodyText tone="muted">🔥 {currentStreak} day streak</BodyText>
            )}

            <XStack gap="$5" flexWrap="wrap" justifyContent="center">
                <HudButton onPress={handleShare} size="lg">
                    <HudButton.Text>{shareLabel}</HudButton.Text>
                </HudButton>
                <HudButton onPress={onClose} size="lg">
                    <HudButton.Text>Close</HudButton.Text>
                </HudButton>
            </XStack>
            <SubLabel>See you tomorrow!</SubLabel>
        </Modal>
    )
}
