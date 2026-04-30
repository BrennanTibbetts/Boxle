import { XStack, YStack, styled } from 'tamagui'

/**
 * The translucent floating chip — used by the bottom HUD bar and the
 * floating hint description. Sits absolutely positioned by its caller.
 */
export const HudChip = styled(XStack, {
    name: 'HudChip',
    backgroundColor: '$bgGlassMid',
    borderColor: '$borderMuted',
    borderWidth: 1,
    borderRadius: '$5',
    paddingHorizontal: '$6',
    paddingVertical: '$2',
    alignItems: 'center',
    gap: '$6',
    pointerEvents: 'auto',
})

export const HudChipColumn = styled(YStack, {
    name: 'HudChipColumn',
    backgroundColor: '$bgGlassMid',
    borderColor: '$borderMuted',
    borderWidth: 1,
    borderRadius: '$5',
    paddingHorizontal: '$6',
    paddingVertical: '$2',
    gap: '$2',
    pointerEvents: 'auto',
})
