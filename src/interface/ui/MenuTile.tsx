import { View, Text, styled, withStaticProperties } from 'tamagui'

const MenuTileFrame = styled(View, {
    name: 'MenuTileFrame',
    render: <button type="button" />,
    role: 'button',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '$2',
    minWidth: 180,
    minHeight: 140,
    paddingHorizontal: '$8',
    paddingVertical: '$7',
    backgroundColor: '$bgCardSolid',
    borderColor: '$borderStrong',
    borderWidth: 1,
    borderRadius: '$6',
    cursor: 'pointer',

    hoverStyle: {
        backgroundColor: '$bgGlassStrong',
        borderColor: '$borderActive',
        y: -2,
    },
    focusStyle: {
        backgroundColor: '$bgGlassStrong',
        borderColor: '$borderActive',
        outlineWidth: 0,
    },
    pressStyle: {
        backgroundColor: '$bgGlassActive',
        borderColor: '$borderEmphasis',
        y: 0,
    },
    disabledStyle: {
        opacity: 0.35,
        cursor: 'not-allowed',
    },

    variants: {
        state: {
            default: {},
            done: {
                borderColor: '$accentSuccessBorder',
                hoverStyle: {
                    backgroundColor: '$bgCardSolidStrong',
                    borderColor: '$accentSuccessBorderHover',
                    y: -2,
                },
            },
            resume: {
                borderColor: '$accentWarningBorder',
                hoverStyle: {
                    backgroundColor: '$bgCardSolidStrong',
                    borderColor: '$accentWarningBorderHover',
                    y: -2,
                },
            },
        },
        compact: {
            true: {
                minWidth: 0,
                minHeight: 100,
                padding: '$4',
                gap: '$1',
                borderRadius: '$4',
            },
        },
    } as const,

    defaultVariants: {
        state: 'default',
    },
})

export const MenuTileTitle = styled(Text, {
    name: 'MenuTileTitle',
    fontFamily: '$body',
    fontSize: '$8',
    color: '$textPrimary',
    letterSpacing: 1.6,
    userSelect: 'none',
})

export const MenuTileSub = styled(Text, {
    name: 'MenuTileSub',
    fontFamily: '$body',
    fontSize: '$4',
    color: '$textFaint',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    userSelect: 'none',
})

export const MenuTileMeta = styled(Text, {
    name: 'MenuTileMeta',
    fontFamily: '$body',
    fontSize: '$3',
    color: '$textMuted',
    letterSpacing: 1.2,
    userSelect: 'none',
})

export const MenuTileDoneBadge = styled(Text, {
    name: 'MenuTileDoneBadge',
    fontFamily: '$body',
    fontSize: '$4',
    color: '$accentSuccess',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    userSelect: 'none',
})

export const MenuTile = withStaticProperties(MenuTileFrame, {
    Title: MenuTileTitle,
    Sub: MenuTileSub,
    Meta: MenuTileMeta,
    DoneBadge: MenuTileDoneBadge,
})
