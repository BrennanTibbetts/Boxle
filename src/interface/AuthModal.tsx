import { useEffect, useRef, useState } from 'react'
import { Input, Text, View, XStack, YStack } from 'tamagui'
import useUI from '../stores/useUI'
import useAuth from '../stores/useAuth'
import useProfile, { USERNAME_PATTERN } from '../stores/useProfile'
import { useModalEscape } from './Modal'
import {
    BodyText,
    GlassCard,
    HudButton,
    ModalTitle,
    SubLabel,
} from './ui'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function waitForGsi(timeoutMs = 6000): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google?.accounts?.id) return resolve()
        const start = Date.now()
        const interval = setInterval(() => {
            if (window.google?.accounts?.id) {
                clearInterval(interval)
                resolve()
            } else if (Date.now() - start > timeoutMs) {
                clearInterval(interval)
                reject(new Error('Google Identity Services failed to load'))
            }
        }, 50)
    })
}

// Supabase verifies the ID token's nonce by SHA-256-hashing the raw nonce we
// send on signInWithIdToken and comparing to the hashed nonce we asked Google
// to embed. So: send hashed-hex to Google, raw to Supabase.
async function makeNoncePair(): Promise<{ raw: string; hashedHex: string }> {
    const raw = crypto.randomUUID() + '-' + crypto.randomUUID()
    const bytes = new TextEncoder().encode(raw)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const hashedHex = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    return { raw, hashedHex }
}

function AppleIcon() {
    return (
        <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#ffffff" d="M16.37 12.66c-.02-2.43 1.99-3.6 2.08-3.66-1.13-1.66-2.9-1.88-3.53-1.91-1.5-.15-2.94.88-3.7.88-.78 0-1.95-.86-3.21-.84-1.65.02-3.18.96-4.03 2.44-1.72 2.99-.44 7.4 1.23 9.83.81 1.18 1.78 2.51 3.04 2.46 1.22-.05 1.68-.79 3.16-.79 1.47 0 1.89.79 3.18.77 1.31-.02 2.14-1.2 2.95-2.39.93-1.37 1.31-2.7 1.33-2.77-.03-.01-2.55-.98-2.5-3.92zM13.94 5.5c.67-.81 1.13-1.94 1-3.07-.97.04-2.15.65-2.85 1.46-.62.71-1.18 1.86-1.03 2.96 1.09.08 2.21-.55 2.88-1.35z" />
        </svg>
    )
}

function GoogleIcon() {
    return (
        <svg width={18} height={18} viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
    )
}

function UsernameForm() {
    const username = useProfile((s) => s.username)
    const setUsername = useProfile((s) => s.setUsername)
    const [draft, setDraft] = useState(username ?? '')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [savedFlash, setSavedFlash] = useState(false)

    useEffect(() => {
        setDraft(username ?? '')
    }, [username])

    const dirty = draft !== (username ?? '')
    const valid = USERNAME_PATTERN.test(draft)

    const submit = async () => {
        if (busy || !dirty || !valid) return
        setBusy(true)
        setError(null)
        try {
            await setUsername(draft)
            setSavedFlash(true)
            setTimeout(() => setSavedFlash(false), 1200)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Save failed')
        } finally {
            setBusy(false)
        }
    }

    return (
        <YStack gap="$1" width="100%">
            <SubLabel>{username ? 'Username' : 'Choose a username'}</SubLabel>
            <XStack gap="$2">
                <Input
                    flex={1}
                    minWidth={0}
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    backgroundColor="$bgInputGlass"
                    borderColor="$borderMuted"
                    borderWidth={1}
                    borderRadius="$3"
                    color="$textPrimary"
                    fontFamily="$body"
                    fontSize="$5"
                    letterSpacing={1.0}
                    value={draft}
                    onChangeText={(text: string) => {
                        setError(null)
                        setDraft(text.toLowerCase())
                    }}
                    onSubmitEditing={submit}
                    placeholder="boxlemaster"
                    placeholderTextColor="$textInactive"
                    maxLength={20}
                    autoComplete="off"
                    spellCheck={false}
                    focusStyle={{
                        borderColor: '$borderActive',
                        backgroundColor: '$bgGlassStrong',
                    }}
                />
                <HudButton
                    onPress={submit}
                    disabled={busy || !dirty || !valid}
                    minWidth={64}
                >
                    <HudButton.Text>{busy ? '…' : savedFlash ? '✓' : 'Save'}</HudButton.Text>
                </HudButton>
            </XStack>
            {error && (
                <BodyText tone="danger" textAlign="center" fontSize="$3">
                    {error}
                </BodyText>
            )}
            {!username && !error && (
                <Text
                    fontFamily="$body"
                    fontSize="$2"
                    color="$textInactive"
                    letterSpacing={1.2}
                >
                    3–20 chars · a–z · 0–9 · underscore
                </Text>
            )}
        </YStack>
    )
}

export default function AuthModal() {
    const open = useUI((s) => s.authOpen)
    const setAuthOpen = useUI((s) => s.setAuthOpen)
    const status = useAuth((s) => s.status)
    const user = useAuth((s) => s.user)
    const signInWithGoogleIdToken = useAuth((s) => s.signInWithGoogleIdToken)
    const signInWithApple = useAuth((s) => s.signInWithApple)
    const signOut = useAuth((s) => s.signOut)
    const [error, setError] = useState<string | null>(null)
    const [appleBusy, setAppleBusy] = useState(false)
    const googleBtnRef = useRef<HTMLDivElement | null>(null)
    const cardRef = useRef<HTMLDivElement | null>(null)

    const onClose = () => setAuthOpen(false)
    useModalEscape(onClose, open)

    // Dismiss on click outside the card. Excludes the SIGN IN trigger so the
    // trigger's own toggle doesn't reopen-then-close-on-the-same-event.
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            const target = e.target as Node | null
            if (!target) return
            if (cardRef.current?.contains(target)) return
            const trigger = (target as Element).closest?.('[data-auth-trigger]')
            if (trigger) return
            setAuthOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open, setAuthOpen])

    useEffect(() => {
        if (!open) return
        if (status !== 'unauthenticated') return
        if (!googleBtnRef.current) return

        let cancelled = false
        const target = googleBtnRef.current

        ;(async () => {
            try {
                await waitForGsi()
                if (cancelled) return
                const { raw, hashedHex } = await makeNoncePair()
                if (cancelled) return

                window.google!.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    nonce: hashedHex,
                    callback: async (response) => {
                        try {
                            await signInWithGoogleIdToken(response.credential, raw)
                        } catch (err) {
                            setError(err instanceof Error ? err.message : 'Sign-in failed')
                        }
                    },
                })

                target.replaceChildren()
                window.google!.accounts.id.renderButton(target, {
                    theme: 'filled_black',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 272,
                })
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Google sign-in unavailable')
            }
        })()

        return () => {
            cancelled = true
        }
    }, [open, status, signInWithGoogleIdToken])

    const handleApple = async () => {
        if (appleBusy) return
        setAppleBusy(true)
        setError(null)
        try {
            await signInWithApple()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign-in failed')
            setAppleBusy(false)
        }
    }

    return (
        <YStack
            position="fixed"
            top={0}
            right={0}
            paddingTop={64}
            paddingRight={16}
            zIndex="$6"
            pointerEvents={open ? 'auto' : 'none'}
            opacity={open ? 1 : 0}
            x={open ? 0 : 20}
            scale={open ? 1 : 0.96}
            aria-hidden={!open}
        >
            <GlassCard
                ref={cardRef as any}
                tone="strongest"
                width={320}
                maxWidth="90%"
                alignItems="stretch"
                gap="$4"
                onPress={(e) => e.stopPropagation()}
            >
                <XStack alignItems="center" justifyContent="space-between">
                    <ModalTitle fontSize={22}>Account</ModalTitle>
                    <HudButton
                        tone="close"
                        onPress={onClose}
                        aria-label="Close"
                    >
                        <HudButton.Text size="xl" tone="muted">×</HudButton.Text>
                    </HudButton>
                </XStack>

                {status === 'authenticated' && user ? (
                    <>
                        <UsernameForm />
                        <YStack gap="$1">
                            <SubLabel>Signed in as</SubLabel>
                            <Text
                                fontFamily="$body"
                                fontSize="$5"
                                color="$textPrimary"
                                letterSpacing={0.6}
                                wordWrap="break-word"
                            >
                                {user.email}
                            </Text>
                        </YStack>
                        <HudButton onPress={() => signOut()} alignSelf="stretch">
                            <HudButton.Text>Sign out</HudButton.Text>
                        </HudButton>
                    </>
                ) : (
                    <>
                        <BodyText tone="muted">
                            Sign in to save your stats across devices.
                        </BodyText>
                        <HudButton
                            onPress={() => {
                                const inner = googleBtnRef.current?.querySelector('div[role="button"]') as HTMLElement | null
                                inner?.click()
                            }}
                            backgroundColor="#fff"
                            borderColor="rgba(0,0,0,0.12)"
                            hoverStyle={{
                                backgroundColor: '#f1f1f1',
                                borderColor: 'rgba(0,0,0,0.18)',
                            }}
                        >
                            <GoogleIcon />
                            <HudButton.Text tone="primary">Continue with Google</HudButton.Text>
                        </HudButton>
                        <HudButton
                            onPress={handleApple}
                            disabled={appleBusy}
                            backgroundColor="#000"
                            borderColor="rgba(255,255,255,0.18)"
                            hoverStyle={{
                                backgroundColor: '#1a1a1a',
                                borderColor: 'rgba(255,255,255,0.18)',
                            }}
                        >
                            <AppleIcon />
                            <HudButton.Text tone="bright">
                                {appleBusy ? 'Connecting…' : 'Continue with Apple'}
                            </HudButton.Text>
                        </HudButton>
                        {/* Hidden GSI-rendered button. We click it programmatically
                            from the visible button above so the visible UI can match
                            the Apple button's styling without forking the auth flow.
                            Kept off-screen (rather than display:none) because GSI's
                            renderButton expects a real layout target. */}
                        <View
                            ref={googleBtnRef as any}
                            position="absolute"
                            left={-9999}
                            top={-9999}
                            width={272}
                            height={40}
                            aria-hidden
                        />
                        {error && (
                            <BodyText tone="danger" textAlign="center" fontSize="$3">
                                {error}
                            </BodyText>
                        )}
                    </>
                )}
            </GlassCard>
        </YStack>
    )
}
