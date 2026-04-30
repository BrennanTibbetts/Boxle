import { YStack, styled } from 'tamagui'

/**
 * Full-viewport dim wrapper for modals (EndScreen, Stats, MainMenu overlay,
 * LibraryGameOver, etc.). Rendered absolutely inside the .interface root.
 */
export const ModalOverlay = styled(YStack, {
    name: 'ModalOverlay',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto',
    backgroundColor: '$overlayDim',

    variants: {
        intensity: {
            light: { backgroundColor: '$overlayDim' },
            medium: { backgroundColor: '$overlayMid' },
            heavy: { backgroundColor: '$overlayDeep' },
        },
        layer: {
            game: { zIndex: 20 },
            menu: { zIndex: 15 },
            stats: { zIndex: 30 },
        },
        scrollable: {
            true: {
                $sm: {
                    alignItems: 'flex-start',
                    overflow: 'scroll',
                    paddingTop: 24,
                    paddingBottom: 24,
                },
            },
        },
    } as const,

    defaultVariants: {
        intensity: 'light',
        layer: 'game',
    },
})
