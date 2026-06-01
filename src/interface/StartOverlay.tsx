import { YStack } from 'tamagui'
import useIntro from '../stores/useIntro'
import { HudButton } from './ui'

// The "here's your board, hit Start" affordance shown during Phase.READY. Sits
// below the hero-framed board so it doesn't cover it. Pressing Start hands off
// to IntroCamera, which flies in to the play pose and flips the game to
// PLAYING; we hide the button the moment that fly-in begins.
export default function StartOverlay() {
    const transitioning = useIntro((s) => s.transitioning)
    const begin = useIntro((s) => s.begin)

    if (transitioning) return null

    return (
        <YStack
            position="absolute"
            left={0}
            right={0}
            bottom="14%"
            alignItems="center"
            pointerEvents="box-none"
            zIndex="$5"
        >
            <HudButton tone="primary" size="lg" onPress={begin} aria-label="Start puzzle">
                <HudButton.Text tone="primary" size="lg">Start</HudButton.Text>
            </HudButton>
        </YStack>
    )
}
