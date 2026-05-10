import { XStack, YStack } from 'tamagui'
import useGame, { GameMode } from '../stores/useGame'
import useLibraryRun from '../stores/useLibraryRun'
import { formatTime } from '../utils/share'
import {
    GlassCard,
    HudButton,
    ModalOverlay,
    ModalTitle,
    StatValue,
    SubLabel,
} from './ui'

export default function LibraryBatchComplete() {
    const setMode = useGame((state) => state.setMode)
    const startTime = useGame((s) => s.startTime)
    const endTime = useGame((s) => s.endTime)
    const dismissBatchComplete = useLibraryRun((s) => s.dismissBatchComplete)
    const leaveTier = useLibraryRun((s) => s.leaveTier)
    const activeTierSize = useLibraryRun((s) => s.activeTierSize)

    if (activeTierSize === null) return null

    const elapsed = startTime && endTime ? endTime - startTime : null

    return (
        <ModalOverlay intensity="light" layer="game">
            <GlassCard size="lg" minWidth={280}>
                <ModalTitle>Batch Complete</ModalTitle>
                <XStack gap="$9" justifyContent="center">
                    <YStack alignItems="center" gap="$1">
                        <SubLabel>Size</SubLabel>
                        <StatValue>{activeTierSize}×{activeTierSize}</StatValue>
                    </YStack>
                    {elapsed !== null && (
                        <YStack alignItems="center" gap="$1">
                            <SubLabel>Time</SubLabel>
                            <StatValue>{formatTime(elapsed)}</StatValue>
                        </YStack>
                    )}
                </XStack>
                <SubLabel>10 puzzles cleared</SubLabel>

                <XStack gap="$5" flexWrap="wrap" justifyContent="center">
                    <HudButton onPress={() => dismissBatchComplete()} size="lg">
                        <HudButton.Text>Another Batch</HudButton.Text>
                    </HudButton>
                    <HudButton onPress={() => leaveTier()} size="lg">
                        <HudButton.Text>Tier Picker</HudButton.Text>
                    </HudButton>
                    <HudButton onPress={() => setMode(GameMode.MENU)} size="lg">
                        <HudButton.Text>Menu</HudButton.Text>
                    </HudButton>
                </XStack>
            </GlassCard>
        </ModalOverlay>
    )
}
