import { XStack, YStack } from 'tamagui'
import useGame, { GameMode } from '../stores/useGame'
import useHint from '../stores/useHint'
import usePersistence from '../stores/usePersistence'
import { findBestHint } from '../utils/hintRules'
import { recordMissingHint } from '../utils/hintReport'
import { useIsMobile } from '../hooks/useIsMobile'
import { HudButton, HudLabel, HudValue, HudChip } from './ui'

function HeartIcon({ filled }: { filled: boolean }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
            style={{
                fill: filled ? '#ef4444' : 'none',
                stroke: filled ? 'none' : 'rgba(255,255,255,0.25)',
                strokeWidth: filled ? 0 : 2,
                opacity: filled ? 1 : 0.5,
                filter: filled ? 'drop-shadow(0 0 4px rgba(239,68,68,0.6))' : 'none',
                transition: 'fill 0.3s ease, opacity 0.3s ease',
            }}
        >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
    )
}

export default function HUD() {
    // Narrow selectors only — `levels` and `levelConfigs` mutate on every
    // placement; reading them via getState() inside the click handler keeps
    // HUD off the wrong-placement re-render path.
    const lives = useGame((state) => state.lives)
    const currentLevel = useGame((state) => state.currentLevel)
    const clearMarks = useGame((state) => state.clearMarks)
    const activeHint = useHint((state) => state.activeHint)
    const setHint = useHint((state) => state.setHint)
    const clearHint = useHint((state) => state.clearHint)
    const isMobile = useIsMobile()

    const handleHint = () => {
        if (activeHint) {
            clearHint()
            return
        }
        const game = useGame.getState()
        const levelIndex = game.currentLevel - 1
        const config = game.levelConfigs[levelIndex]
        const grid = game.levels[levelIndex]
        if (!config || !grid) return
        const result = findBestHint(levelIndex, config.levelMatrix, grid)
        setHint(result)
        if (result === null) void recordMissingHint()
        game.incrementSessionHint()
        if (game.activeMode !== GameMode.MENU) {
            usePersistence.getState().recordHint(game.activeMode)
        }
    }

    return (
        <>
            <YStack
                position="absolute"
                bottom={20}
                left="50%"
                x="-50%"
                gap="$2"
                zIndex="$1"
                pointerEvents="auto"
                maxWidth="95%"
            >
                <HudChip
                    flexDirection={isMobile ? 'column' : 'row'}
                    alignItems="stretch"
                    gap={isMobile ? '$2' : '$6'}
                    paddingHorizontal={isMobile ? '$3' : '$6'}
                    paddingVertical="$2"
                >
                    <XStack alignItems="center" justifyContent="center" gap="$6">
                        <XStack alignItems="center" gap="$2">
                            <HudLabel>Level</HudLabel>
                            <HudValue>{currentLevel}</HudValue>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                            {[1, 2, 3].map((i) => (
                                <HeartIcon key={i} filled={lives >= i} />
                            ))}
                        </XStack>
                    </XStack>

                    <XStack
                        alignItems="center"
                        justifyContent="center"
                        gap={isMobile ? '$3' : '$2'}
                    >
                        <HudButton
                            onPress={() => clearMarks(currentLevel - 1)}
                            aria-label="Clear marks"
                            size={isMobile ? 'tap' : 'md'}
                        >
                            <HudButton.Text size={isMobile ? 'lg' : 'md'}>
                                {isMobile ? '✕' : 'Clear Marks'}
                            </HudButton.Text>
                        </HudButton>
                        <HudButton
                            onPress={handleHint}
                            tone={activeHint ? 'hintActive' : 'hint'}
                            size={isMobile ? 'tap' : 'md'}
                            aria-label={activeHint ? 'Dismiss hint' : 'Show hint'}
                        >
                            <HudButton.Text size="lg">💡</HudButton.Text>
                        </HudButton>
                    </XStack>
                </HudChip>
            </YStack>
        </>
    )
}
