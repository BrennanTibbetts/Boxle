import { YStack } from 'tamagui'
import useGame from '../stores/useGame'
import { HudButton } from './ui'

export default function ControlsManager() {
    const restart = useGame((state) => state.restart)

    return (
        <YStack display="none">
            <HudButton onPress={restart}>
                <HudButton.Text>Restart</HudButton.Text>
            </HudButton>
        </YStack>
    )
}
