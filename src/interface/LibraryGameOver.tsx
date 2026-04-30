import { XStack, YStack } from 'tamagui'
import useGame, { GameMode } from '../stores/useGame'
import useLibraryRun, { LIBRARY_BATCH_SIZE } from '../stores/useLibraryRun'
import {
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
        <ModalOverlay intensity="light" layer="game">
            <GlassCard size="lg" minWidth={280}>
                <ModalTitle>Game Over</ModalTitle>

                <XStack gap="$9" flexWrap="wrap" justifyContent="center">
                    <StatBlock label="Size" value={`${activeTierSize}×${activeTierSize}`} />
                    <StatBlock
                        label="Cleared"
                        value={`${puzzlesCompletedInTier} / ${LIBRARY_BATCH_SIZE}`}
                    />
                    {batchHintsUsed > 0 && <StatBlock label="Hints" value={batchHintsUsed} />}
                    {batchLivesLost > 0 && <StatBlock label="Mistakes" value={batchLivesLost} />}
                </XStack>

                <SubLabel>Batch progress lost. Start over from puzzle 1?</SubLabel>

                <XStack gap="$5" flexWrap="wrap" justifyContent="center">
                    <HudButton onPress={() => restartBatch()} size="lg">
                        <HudButton.Text>Restart Batch</HudButton.Text>
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
