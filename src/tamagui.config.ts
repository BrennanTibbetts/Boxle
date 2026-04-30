import { createTamagui, createFont, createTokens } from 'tamagui'
import { shorthands } from '@tamagui/config/v4'

const bebas = createFont({
    family: "'Bebas Neue', cursive",
    size: {
        1: 11,
        2: 12,
        3: 13,
        4: 14,
        true: 14,
        5: 16,
        6: 18,
        7: 20,
        8: 23,
        9: 30,
        10: 36,
        11: 42,
        12: 48,
        13: 56,
        14: 64,
    },
    lineHeight: {
        1: 14,
        2: 16,
        3: 18,
        4: 20,
        true: 20,
        5: 22,
        6: 24,
        7: 28,
        8: 30,
        9: 36,
        10: 42,
        11: 48,
        12: 54,
        13: 64,
        14: 72,
    },
    weight: {
        4: '400',
        6: '600',
        7: '700',
    },
    letterSpacing: {
        1: 0,
        2: 0.4,
        3: 0.6,
        4: 0.8,
        true: 0.8,
        5: 1.0,
        6: 1.2,
        7: 1.4,
        8: 1.6,
        9: 2.0,
        10: 2.4,
    },
})

const palette = {
    // Background
    bgApp: '#151517',
    bgGlass: 'rgba(255,255,255,0.06)',
    bgGlassMid: 'rgba(255,255,255,0.07)',
    bgGlassStrong: 'rgba(255,255,255,0.12)',
    bgGlassActive: 'rgba(255,255,255,0.18)',
    bgInputGlass: 'rgba(255,255,255,0.08)',

    bgCardSolid: 'rgba(21,21,23,0.92)',
    bgCardSolidStrong: 'rgba(21,21,23,0.94)',
    bgCardSolidStronger: 'rgba(21,21,23,0.96)',

    // Borders
    borderSubtle: 'rgba(255,255,255,0.08)',
    borderMuted: 'rgba(255,255,255,0.12)',
    borderStrong: 'rgba(255,255,255,0.14)',
    borderActive: 'rgba(255,255,255,0.28)',
    borderSelected: 'rgba(255,255,255,0.35)',
    borderEmphasis: 'rgba(255,255,255,0.4)',

    // Text
    textPrimary: '#ffffff',
    textBody: 'rgba(255,255,255,0.85)',
    textSecondary: 'rgba(255,255,255,0.78)',
    textMuted: 'rgba(255,255,255,0.7)',
    textDim: 'rgba(255,255,255,0.6)',
    textFaint: 'rgba(255,255,255,0.55)',
    textLowest: 'rgba(255,255,255,0.45)',
    textInactive: 'rgba(255,255,255,0.4)',
    textGhost: 'rgba(255,255,255,0.25)',

    // Accents
    accentSuccess: '#86efac',
    accentSuccessBg: 'rgba(134,239,172,0.12)',
    accentSuccessBgHover: 'rgba(134,239,172,0.2)',
    accentSuccessBorder: 'rgba(134,239,172,0.4)',
    accentSuccessBorderHover: 'rgba(134,239,172,0.6)',

    accentWarning: 'rgba(253,224,71,1)',
    accentWarningBg: 'rgba(253,224,71,0.1)',
    accentWarningBgHover: 'rgba(253,224,71,0.18)',
    accentWarningBorder: 'rgba(253,224,71,0.35)',
    accentWarningBorderHover: 'rgba(253,224,71,0.55)',

    accentHint: 'rgba(255,215,0,1)',
    accentHintBg: 'rgba(255,215,0,0.12)',
    accentHintBorder: 'rgba(255,215,0,0.35)',
    accentHintGlow: 'rgba(255,215,0,0.45)',

    accentDanger: '#ef4444',
    accentDangerGlow: 'rgba(239,68,68,0.6)',
    accentDangerText: '#ff8a8a',

    accentInfo: '#7dd3fc',
    accentSuccessText: '#86efac',
    accentBoxle: '#fde047',
    accentWarn: '#f87171',

    statusOnline: '#4ade80',

    // Overlay
    overlayDim: 'rgba(0,0,0,0.65)',
    overlayMid: 'rgba(0,0,0,0.78)',
    overlayDeep: 'rgba(0,0,0,0.88)',
    cardShadow: 'rgba(0,0,0,0.35)',
    cardShadowDeep: 'rgba(0,0,0,0.45)',

    // Transparent
    transparent: 'rgba(0,0,0,0)',
}

const sizes = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 14,
    true: 14,
    5: 16,
    6: 20,
    7: 24,
    8: 28,
    9: 32,
    10: 36,
    11: 40,
    12: 44,
    13: 52,
    14: 64,
}

const space = {
    ...sizes,
    '-1': -4,
    '-2': -8,
    '-3': -12,
    '-4': -14,
    '-5': -16,
}

const radius = {
    0: 0,
    1: 4,
    2: 6,
    3: 8,
    4: 10,
    true: 10,
    5: 12,
    6: 14,
    7: 16,
    8: 20,
    pill: 999,
}

const zIndex = {
    0: 0,
    1: 10,
    2: 15,
    3: 20,
    4: 30,
    5: 200,
    6: 240,
    7: 250,
}

const tokens = createTokens({
    color: palette,
    space,
    size: sizes,
    radius,
    zIndex,
})

const darkTheme = {
    background: palette.bgApp,
    backgroundHover: palette.bgGlassMid,
    backgroundPress: palette.bgGlassActive,
    backgroundFocus: palette.bgGlassStrong,
    backgroundStrong: palette.bgCardSolid,
    backgroundTransparent: palette.transparent,
    color: palette.textPrimary,
    colorHover: palette.textPrimary,
    colorPress: palette.textPrimary,
    colorFocus: palette.textPrimary,
    colorTransparent: palette.transparent,
    borderColor: palette.borderMuted,
    borderColorHover: palette.borderActive,
    borderColorPress: palette.borderEmphasis,
    borderColorFocus: palette.borderEmphasis,
    placeholderColor: palette.textInactive,
    shadowColor: palette.cardShadow,
    shadowColorHover: palette.cardShadowDeep,
    shadowColorPress: palette.cardShadowDeep,
    shadowColorFocus: palette.cardShadowDeep,
}

const media = {
    xxs: { maxWidth: 360 },
    xs: { maxWidth: 480 },
    sm: { maxWidth: 768 },
    md: { maxWidth: 1024 },
    lg: { maxWidth: 1280 },
    gtXxs: { minWidth: 361 },
    gtXs: { minWidth: 481 },
    gtSm: { minWidth: 769 },
    gtMd: { minWidth: 1025 },
    short: { maxHeight: 640 },
    pointerCoarse: { pointer: 'coarse' },
    hoverNone: { hover: 'none' },
}

export const config = createTamagui({
    fonts: {
        body: bebas,
        heading: bebas,
        bebas,
    },
    tokens,
    themes: {
        dark: darkTheme,
    },
    shorthands,
    media,
    defaultFont: 'body',
    settings: {
        allowedStyleValues: 'somewhat-strict-web',
        defaultPosition: 'relative',
        fastSchemeChange: true,
        styleCompat: 'legacy',
    },
})

export type AppConfig = typeof config

declare module 'tamagui' {
    interface TamaguiCustomConfig extends AppConfig {}
}

export default config
