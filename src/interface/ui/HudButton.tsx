import { View, Text, styled, withStaticProperties } from 'tamagui'

/**
 * Stack-based button frame. We use a styled Stack instead of Tamagui's Button
 * because Tamagui's Button distributes text-style props via context, which
 * `styled()`'s type doesn't surface — easier to compose our own from raw stacks.
 */
const HudButtonFrame = styled(View, {
    name: 'HudButtonFrame',
    render: <button type="button" />,
    role: 'button',
    cursor: 'pointer',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '$bgGlass',
    borderColor: '$borderStrong',
    borderWidth: 1,
    borderRadius: '$2',
    paddingHorizontal: '$5',
    paddingVertical: '$2',
    gap: '$2',

    hoverStyle: {
        backgroundColor: '$bgGlassStrong',
        borderColor: '$borderActive',
    },
    pressStyle: {
        backgroundColor: '$bgGlassActive',
        borderColor: '$borderEmphasis',
    },
    focusStyle: {
        outlineWidth: 0,
    },
    disabledStyle: {
        opacity: 0.4,
        cursor: 'not-allowed',
    },

    variants: {
        tone: {
            default: {},
            primary: {
                backgroundColor: '#fff',
                borderColor: 'transparent',
                hoverStyle: {
                    backgroundColor: '#e8e8e8',
                    borderColor: 'transparent',
                },
            },
            hint: {
                paddingHorizontal: '$4',
            },
            hintActive: {
                backgroundColor: '$accentHintBg',
                borderColor: '$accentHintBorder',
                paddingHorizontal: '$4',
                shadowColor: '$accentHintGlow',
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 5,
            },
            rulesActive: {
                backgroundColor: '$bgGlassActive',
                borderColor: '$borderEmphasis',
            },
            account: {
                borderRadius: '$pill',
                paddingHorizontal: '$6',
                height: 40,
            },
            accountSignedIn: {
                borderRadius: '$pill',
                paddingHorizontal: 26,
                height: 40,
            },
            danger: {
                backgroundColor: 'rgba(239,68,68,0.12)',
                borderColor: 'rgba(239,68,68,0.4)',
                hoverStyle: {
                    backgroundColor: 'rgba(239,68,68,0.18)',
                    borderColor: 'rgba(239,68,68,0.6)',
                },
            },
            statTab: {
                backgroundColor: 'transparent',
                borderColor: '$borderStrong',
                paddingHorizontal: '$5',
                paddingVertical: '$1',
            },
            statTabActive: {
                backgroundColor: '$bgGlassStrong',
                borderColor: '$borderSelected',
            },
            ghost: {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                hoverStyle: {
                    backgroundColor: '$bgGlassMid',
                },
            },
            secondaryChip: {
                paddingHorizontal: '$4',
                paddingVertical: '$1',
                borderRadius: '$1',
                backgroundColor: '$bgInputGlass',
                borderColor: '$borderMuted',
            },
            close: {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                width: 28,
                height: 28,
                paddingHorizontal: 0,
                paddingVertical: 0,
                hoverStyle: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                },
                pressStyle: {
                    backgroundColor: 'transparent',
                    borderColor: 'transparent',
                },
            },
        },
        size: {
            sm: {
                paddingHorizontal: '$3',
                paddingVertical: '$1',
                minHeight: 28,
            },
            md: {
                paddingHorizontal: '$5',
                paddingVertical: '$2',
                minHeight: 32,
            },
            lg: {
                paddingHorizontal: '$7',
                paddingVertical: '$3',
                minHeight: 40,
            },
            menu: {
                paddingHorizontal: '$5',
                paddingVertical: '$3',
                minHeight: 36,
            },
            tap: {
                minHeight: 44,
                minWidth: 44,
                paddingHorizontal: '$3',
                paddingVertical: '$1',
            },
        },
    } as const,

    defaultVariants: {
        tone: 'default',
        size: 'md',
    },
})

/**
 * Default text styling for HudButton children. Override with `tone='primary'`
 * etc. when the button background needs different text.
 */
export const HudButtonText = styled(Text, {
    name: 'HudButtonText',
    fontFamily: '$body',
    fontSize: '$3',
    color: '$textMuted',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    lineHeight: '$3',
    userSelect: 'none',

    variants: {
        tone: {
            default: { color: '$textMuted' },
            bright: { color: '$textPrimary' },
            primary: { color: '#111' },
            danger: { color: '$accentDangerText' },
            muted: { color: '$textInactive' },
            success: { color: '$accentSuccess' },
        },
        size: {
            sm: { fontSize: '$2' },
            md: { fontSize: '$3' },
            lg: { fontSize: '$5' },
            xl: { fontSize: '$6' },
            menu: { fontSize: '$4', letterSpacing: 1.6 },
            iconBig: { fontSize: '$5', letterSpacing: 0 },
            heading: { fontSize: '$5', fontWeight: '700' },
        },
    } as const,
})

export const HudButton = withStaticProperties(HudButtonFrame, {
    Text: HudButtonText,
})

export type HudButtonToneText = NonNullable<
    React.ComponentProps<typeof HudButtonText>['tone']
>
