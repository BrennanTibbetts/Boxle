import { Text, H1, H2, styled } from 'tamagui'

export const HudLabel = styled(Text, {
    name: 'HudLabel',
    fontFamily: '$body',
    fontSize: '$3',
    color: '$textLowest',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
})

export const HudValue = styled(Text, {
    name: 'HudValue',
    fontFamily: '$body',
    fontSize: '$7',
    color: '$textPrimary',
    letterSpacing: 1.0,
    minWidth: 24,
    textAlign: 'center',
})

export const BodyText = styled(Text, {
    name: 'BodyText',
    fontFamily: '$body',
    fontSize: '$4',
    color: '$textSecondary',
    letterSpacing: 0.6,
    lineHeight: '$6',

    variants: {
        tone: {
            primary: { color: '$textPrimary' },
            body: { color: '$textBody' },
            secondary: { color: '$textSecondary' },
            muted: { color: '$textMuted' },
            faint: { color: '$textFaint' },
            danger: { color: '$accentDangerText' },
            success: { color: '$accentSuccess' },
        },
        emphasis: {
            true: { color: '$textPrimary', fontWeight: '600' },
        },
    } as const,
})

export const ModalTitle = styled(H2, {
    name: 'ModalTitle',
    fontFamily: '$body',
    fontSize: 32,
    color: '$textPrimary',
    letterSpacing: 1.6,
    margin: 0,
})

export const PageTitle = styled(H1, {
    name: 'PageTitle',
    fontFamily: '$body',
    fontSize: 64,
    color: '$textPrimary',
    letterSpacing: 2.4,
    margin: 0,

    variants: {
        size: {
            sm: { fontSize: 32, letterSpacing: 1.6 },
            md: { fontSize: 40, letterSpacing: 1.6 },
            lg: { fontSize: 64, letterSpacing: 2.4 },
        },
    } as const,
})

export const SubLabel = styled(Text, {
    name: 'SubLabel',
    fontFamily: '$body',
    fontSize: '$2',
    color: '$textLowest',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
})

export const StatValue = styled(Text, {
    name: 'StatValue',
    fontFamily: '$body',
    fontSize: 30,
    color: '$textPrimary',
    letterSpacing: 1.0,
    lineHeight: 32,
})
