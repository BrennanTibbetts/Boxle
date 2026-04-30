import { Text, View, YStack } from 'tamagui'
import useUI from '../stores/useUI'
import useAuth from '../stores/useAuth'
import useProfile from '../stores/useProfile'
import { HudButton } from './ui'

export default function AccountButton() {
    const open = useUI((s) => s.authOpen)
    const setAuthOpen = useUI((s) => s.setAuthOpen)
    const status = useAuth((s) => s.status)
    const username = useProfile((s) => s.username)
    const profileLoaded = useProfile((s) => s.loaded)

    const isSignedIn = status === 'authenticated'
    const label = !isSignedIn
        ? 'Sign in'
        : username ?? (profileLoaded ? 'Set username' : '…')

    return (
        <YStack
            position="absolute"
            top={16}
            right={16}
            zIndex="$7"
            pointerEvents="auto"
        >
            <HudButton
                tone={isSignedIn ? 'accountSignedIn' : 'account'}
                onPress={() => setAuthOpen(!open)}
                aria-label={isSignedIn ? `Account: ${label}` : 'Sign in'}
                {...({ 'data-auth-trigger': '' } as any)}
            >
                <Text
                    fontFamily="$body"
                    fontSize="$4"
                    color="$textMuted"
                    letterSpacing={1.2}
                    textTransform="uppercase"
                    maxWidth={140}
                    overflow="hidden"
                    whiteSpace="nowrap"
                    {...({ textOverflow: 'ellipsis' } as any)}
                >
                    {label}
                </Text>
                {isSignedIn && (
                    <View
                        position="absolute"
                        top="50%"
                        right={12}
                        y={-4}
                        width={8}
                        height={8}
                        borderRadius="$pill"
                        backgroundColor="$statusOnline"
                        borderColor="$bgCardSolidStronger"
                        borderWidth={2}
                    />
                )}
            </HudButton>
        </YStack>
    )
}
