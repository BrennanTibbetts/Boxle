import { useEffect } from 'react'
import { Text, YStack, XStack } from 'tamagui'
import useUI from '../stores/useUI'
import useGame, { GameMode } from '../stores/useGame'
import { useIsMobile } from '../hooks/useIsMobile'
import { BoxleIcon, MarkIcon, LockIcon } from '../components/BoxIcons'
import { useModalEscape } from './Modal'
import {
    BodyText,
    GlassCard,
    HudButton,
    ModalOverlay,
    ModalTitle,
} from './ui'

const SEEN_KEY = 'boxle-rules-seen'

const ROW_COLOR = '#7dd3fc'
const COL_COLOR = '#86efac'
const BOXLE_COLOR = '#fde047'
const WARN_COLOR = '#f87171'

function Em({ children, color }: { children: React.ReactNode; color?: string }) {
    return (
        <Text
            color={(color ?? '$textPrimary') as any}
            fontWeight="600"
            fontFamily="$body"
            letterSpacing={0.6}
        >
            {children}
        </Text>
    )
}

function RulesContent({ isMobile }: { isMobile: boolean }) {
    const markVerb = isMobile ? 'Tap' : 'Click'
    const placeVerb = isMobile ? 'Hold' : 'Double-click'
    return (
        <>
            <BodyText>
                Each board is a grid divided into <Em>colored regions</Em>.
            </BodyText>
            <BodyText>
                <Em>Goal:</Em> place exactly one <Em color={BOXLE_COLOR}>boxle</Em> in
                every <Em color={ROW_COLOR}>row</Em>, every <Em color={COL_COLOR}>column</Em>, and every <Em>colored region</Em>.
            </BodyText>
            <YStack gap="$1" paddingLeft="$5">
                <BodyText>
                    • Every <Em color={ROW_COLOR}>row</Em> has exactly one <Em color={BOXLE_COLOR}>boxle</Em>.
                </BodyText>
                <BodyText>
                    • Every <Em color={COL_COLOR}>column</Em> has exactly one <Em color={BOXLE_COLOR}>boxle</Em>.
                </BodyText>
                <BodyText>
                    • Every <Em>colored region</Em> has exactly one <Em color={BOXLE_COLOR}>boxle</Em>.
                </BodyText>
                <BodyText>
                    • No two <Em color={BOXLE_COLOR}>boxles</Em> may <Em color={WARN_COLOR}>touch</Em> — not even <Em color={WARN_COLOR}>diagonally</Em>.
                </BodyText>
            </YStack>
            <BodyText>
                <Em>Play by elimination.</Em> Rule out the boxes where a {' '}
                <Em color={BOXLE_COLOR}>boxle</Em> can't go — place one only when logic
                leaves no other option. Guesses cost a life.
            </BodyText>

            <YStack
                gap="$2"
                paddingTop="$3"
                borderTopWidth={1}
                borderTopColor="$borderSubtle"
                width="100%"
            >
                <XStack alignItems="center" gap="$3">
                    <MarkIcon />
                    <BodyText>{markVerb} a box to place a mark (rules it out).</BodyText>
                </XStack>
                <XStack alignItems="center" gap="$3">
                    <BoxleIcon />
                    <BodyText>{placeVerb} a box to place a <Em color={BOXLE_COLOR}>boxle</Em>.</BodyText>
                </XStack>
                <XStack alignItems="center" gap="$3">
                    <LockIcon />
                    <BodyText>Boxes ruled out lock automatically.</BodyText>
                </XStack>
            </YStack>
        </>
    )
}

export default function RulesModal() {
    const open = useUI((state) => state.rulesOpen)
    const setRulesOpen = useUI((state) => state.setRulesOpen)
    const activeMode = useGame((state) => state.activeMode)
    const isMobile = useIsMobile()
    const onMenu = activeMode === GameMode.MENU
    // Use the centered modal variant when there's no live board to slide
    // alongside (main menu) OR when the viewport is too narrow for a side
    // panel to make sense (mobile).
    const useCentered = onMenu || isMobile

    // Only toggle the body class for the in-game side-panel layout. The
    // centered variant doesn't shift the board.
    useEffect(() => {
        if (!open || useCentered) return
        document.body.classList.add('rules-open')
        return () => document.body.classList.remove('rules-open')
    }, [open, useCentered])

    const onClose = () => {
        localStorage.setItem(SEEN_KEY, '1')
        setRulesOpen(false)
    }

    useModalEscape(onClose, open)

    if (!open) return null

    if (useCentered) {
        return (
            <ModalOverlay
                intensity="medium"
                layer="stats"
                onPress={onClose}
                aria-hidden={!open}
            >
                <GlassCard
                    onPress={(e) => e.stopPropagation()}
                    width={420}
                    maxWidth="90%"
                    alignItems="stretch"
                    $sm={{ maxHeight: '88%', overflow: 'scroll' }}
                >
                    <ModalTitle>How to play</ModalTitle>
                    <RulesContent isMobile={isMobile} />
                    <HudButton tone="primary" size="lg" onPress={onClose} alignSelf="stretch">
                        <HudButton.Text tone="primary" size="md">Got it</HudButton.Text>
                    </HudButton>
                </GlassCard>
            </ModalOverlay>
        )
    }

    // Desktop in-game side-panel: slides in from the right.
    return (
        <YStack
            position="fixed"
            top={0}
            right={0}
            height="100%"
            width="50%"
            alignItems="center"
            justifyContent="center"
            paddingHorizontal="$6"
            zIndex="$5"
            pointerEvents="auto"
            aria-hidden={!open}
        >
            <GlassCard
                width={440}
                maxWidth="100%"
                alignItems="stretch"
                onPress={(e) => e.stopPropagation()}
            >
                <ModalTitle>How to play</ModalTitle>
                <RulesContent isMobile={isMobile} />
                <HudButton tone="primary" size="lg" onPress={onClose} alignSelf="stretch">
                    <HudButton.Text tone="primary" size="md">Got it</HudButton.Text>
                </HudButton>
            </GlassCard>
        </YStack>
    )
}

export function useFirstVisitRules() {
    const setRulesOpen = useUI((state) => state.setRulesOpen)

    useEffect(() => {
        if (!localStorage.getItem(SEEN_KEY)) {
            setRulesOpen(true)
        }
    }, [setRulesOpen])
}
