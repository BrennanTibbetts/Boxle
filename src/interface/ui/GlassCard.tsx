import { YStack, styled } from 'tamagui'

/**
 * Solid dark glass card used by modals (EndScreen, StatsModal, RulesModal, AuthModal,
 * DailyPerformanceModal). One shared recipe — modals tweak with style props.
 */
export const GlassCard = styled(YStack, {
    name: 'GlassCard',
    backgroundColor: '$bgCardSolid',
    borderColor: '$borderMuted',
    borderWidth: 1,
    borderRadius: '$7',
    paddingHorizontal: '$8',
    paddingVertical: '$8',
    gap: '$5',
    alignItems: 'center',
    shadowColor: '$cardShadowDeep',
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 40,

    variants: {
        tone: {
            solid: {
                backgroundColor: '$bgCardSolid',
            },
            stronger: {
                backgroundColor: '$bgCardSolidStrong',
            },
            strongest: {
                backgroundColor: '$bgCardSolidStronger',
            },
        },
        size: {
            sm: {
                paddingHorizontal: '$5',
                paddingVertical: '$5',
                gap: '$3',
            },
            md: {
                paddingHorizontal: '$8',
                paddingVertical: '$8',
                gap: '$5',
            },
            lg: {
                paddingHorizontal: 52,
                paddingVertical: 40,
                gap: '$7',
            },
        },
    } as const,

    defaultVariants: {
        tone: 'stronger',
        size: 'md',
    },
})
