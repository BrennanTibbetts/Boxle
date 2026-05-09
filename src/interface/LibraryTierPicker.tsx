import { XStack, YStack } from 'tamagui'
import useGame, { GameMode } from '../stores/useGame'
import usePersistence from '../stores/usePersistence'
import useLibraryRun, { LIBRARY_MIN_SIZE, LIBRARY_MAX_SIZE, LIBRARY_BATCH_SIZE } from '../stores/useLibraryRun'
import useUpsell from '../stores/useUpsell'
import { canPlayAt } from '../utils/gates'
import {
    HudButton,
    MenuTile,
    ModalOverlay,
    PageTitle,
} from './ui'

export default function LibraryTierPicker() {
    const setMode = useGame((state) => state.setMode)
    const enterTier = useLibraryRun((s) => s.enterTier)
    const libraryProgress = usePersistence((state) => state.libraryProgress)
    const tierCompletions = usePersistence((state) => state.stats.library.tierCompletions)

    const sizes: number[] = []
    for (let n = LIBRARY_MIN_SIZE; n <= LIBRARY_MAX_SIZE; n++) sizes.push(n)

    return (
        <ModalOverlay intensity="medium" layer="menu" scrollable>
            <YStack
                alignItems="center"
                gap="$8"
                padding="$11"
                width="100%"
                maxWidth={620}
                $sm={{ gap: '$5', padding: '$5' }}
            >
                <PageTitle size="md">Library</PageTitle>

                <XStack
                    flexWrap="wrap"
                    justifyContent="center"
                    gap="$3"
                    width="100%"
                >
                    {sizes.map((size) => {
                        const unlocked = size <= libraryProgress.unlockedMaxSize
                        const allowed = canPlayAt(size, GameMode.LIBRARY)
                        // Progression-locked tiles stay inert. Gate-blocked
                        // (unlocked-but-paid) tiles are tappable and route
                        // to the upsell — preview-tease behavior per phase 7.
                        const tileDisabled = !unlocked
                        const onPress = () => {
                            if (!unlocked) return
                            if (allowed) {
                                enterTier(size)
                                return
                            }
                            useUpsell.getState().openUpsell({
                                reason: 'library-tier',
                                onPurchaseSuccess: () => enterTier(size),
                            })
                        }
                        const completionsHere = tierCompletions[size] ?? 0
                        const batchesHere = Math.floor(completionsHere / LIBRARY_BATCH_SIZE)
                        const inProgress = completionsHere - batchesHere * LIBRARY_BATCH_SIZE

                        return (
                            <MenuTile
                                key={size}
                                compact
                                disabled={tileDisabled}
                                onPress={onPress}
                                width={120}
                                $sm={{ width: '30%', minWidth: 92 }}
                                $xs={{ width: '45%' }}
                            >
                                <MenuTile.Title>{size}×{size}</MenuTile.Title>
                                {unlocked ? (
                                    !allowed ? (
                                        <MenuTile.Sub>Premium</MenuTile.Sub>
                                    ) : (
                                        <>
                                            <MenuTile.Meta>{batchesHere} batches</MenuTile.Meta>
                                            <MenuTile.Sub>{inProgress}/{LIBRARY_BATCH_SIZE}</MenuTile.Sub>
                                        </>
                                    )
                                ) : (
                                    <MenuTile.Sub>Locked</MenuTile.Sub>
                                )}
                            </MenuTile>
                        )
                    })}
                </XStack>

                <XStack gap="$5">
                    <HudButton onPress={() => setMode(GameMode.MENU)} size="lg">
                        <HudButton.Text>Back to Menu</HudButton.Text>
                    </HudButton>
                </XStack>
            </YStack>
        </ModalOverlay>
    )
}
