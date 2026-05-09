import { useEffect, useMemo, useState } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from '@stripe/react-stripe-js'
import useUpsell, { type UpsellReason } from '../stores/useUpsell'
import useAuth from '../stores/useAuth'
import useArcadeRun from '../stores/useArcadeRun'
import useLibraryRun from '../stores/useLibraryRun'
import usePersistence from '../stores/usePersistence'
import useUI from '../stores/useUI'
import { useModalEscape } from './Modal'
import { getStripe, UNLOCK_PRICE_LABEL } from '../utils/stripe'
import { createPaymentIntent, waitForPremium } from '../utils/payments'
import {
    BodyText,
    GlassCard,
    HudButton,
    ModalOverlay,
    ModalTitle,
    SubLabel,
} from './ui'

interface CopyShape {
    headline: string
    subhead: string
}

function useReasonCopy(reason: UpsellReason | null): CopyShape | null {
    const arcadeSize = useArcadeRun((s) => s.currentSize)
    const libraryTier = useLibraryRun((s) => s.activeTierSize)
    if (reason === 'arcade-depth') {
        return {
            headline: 'Unlock all sizes',
            subhead: arcadeSize > 0
                ? `You hit the free depth wall at ${arcadeSize}×${arcadeSize}. Unlock to keep the run going.`
                : 'Unlock to keep the run going.',
        }
    }
    if (reason === 'library-tier') {
        const size = libraryTier ?? 0
        return {
            headline: 'Unlock all tiers',
            subhead: size > 0
                ? `Tier ${size} (${size}×${size}) and beyond is part of the full unlock.`
                : 'Higher tiers are part of the full unlock.',
        }
    }
    return null
}

function PriceBlock() {
    return (
        <YStack
            gap="$2"
            paddingVertical="$4"
            paddingHorizontal="$5"
            borderTopWidth={1}
            borderBottomWidth={1}
            borderColor="$borderSubtle"
            alignItems="center"
        >
            <XStack alignItems="baseline" gap="$2">
                <Text
                    fontFamily="$body"
                    fontSize={44}
                    color="$textPrimary"
                    letterSpacing={1.4}
                >
                    {UNLOCK_PRICE_LABEL}
                </Text>
                <Text fontFamily="$body" fontSize="$3" color="$textLowest">
                    one time, no subscription
                </Text>
            </XStack>
            <BodyText tone="muted" textAlign="center" fontSize="$3">
                Unlocks all sizes in Arcade and Library, forever.
            </BodyText>
        </YStack>
    )
}

interface PaymentFormProps {
    onComplete: () => void
}

// Renders the Stripe PaymentElement and orchestrates confirm + post-pay
// premium polling. Lives inside <Elements>, so it has access to the
// useStripe / useElements hooks.
function PaymentForm({ onComplete }: PaymentFormProps) {
    const stripe = useStripe()
    const elements = useElements()
    const userId = useAuth((s) => s.user?.id ?? null)
    const [submitting, setSubmitting] = useState(false)
    const [waiting, setWaiting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const ready = !!stripe && !!elements && !!userId

    const onSubmit = async () => {
        if (!stripe || !elements || !userId || submitting || waiting) return
        setSubmitting(true)
        setError(null)

        const { error: confirmErr } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: window.location.origin },
            // Stay in-app: 3DS challenges and bank redirects open in a
            // popup/iframe rather than navigating the whole page.
            redirect: 'if_required',
        })
        if (confirmErr) {
            setError(confirmErr.message ?? 'Payment failed. Try again or use a different method.')
            setSubmitting(false)
            return
        }

        // Payment succeeded on Stripe's side. Wait for the webhook to
        // flip is_premium server-side and for sync to pull it.
        setSubmitting(false)
        setWaiting(true)
        const ok = await waitForPremium(userId)
        setWaiting(false)
        if (!ok) {
            setError(
                'Payment went through but is taking a moment to register. Refresh in a few seconds — your unlock will be live.'
            )
            return
        }
        onComplete()
    }

    const buttonLabel = waiting
        ? 'Confirming…'
        : submitting
            ? 'Processing payment…'
            : `Pay ${UNLOCK_PRICE_LABEL}`

    return (
        <YStack gap="$3" alignItems="stretch">
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && (
                <BodyText tone="danger" textAlign="center" fontSize="$3">
                    {error}
                </BodyText>
            )}
            <HudButton
                tone="success"
                size="lg"
                onPress={onSubmit}
                disabled={!ready || submitting || waiting}
                alignSelf="stretch"
            >
                <HudButton.Text tone="bright" size="md">
                    {buttonLabel}
                </HudButton.Text>
            </HudButton>
        </YStack>
    )
}

export default function UpsellModal() {
    const open = useUpsell((s) => s.open)
    const reason = useUpsell((s) => s.reason)
    const dismiss = useUpsell((s) => s.dismiss)
    const completePurchase = useUpsell((s) => s.completePurchase)
    const authStatus = useAuth((s) => s.status)
    const isPremium = usePersistence((s) => s.isPremium)
    const setAuthOpen = useUI((s) => s.setAuthOpen)
    const copy = useReasonCopy(reason)

    const [clientSecret, setClientSecret] = useState<string | null>(null)
    const [intentError, setIntentError] = useState<string | null>(null)
    const [openedAuthFromUpsell, setOpenedAuthFromUpsell] = useState(false)

    // Body class so the canvas blurs/desaturates behind the modal — turns
    // the gated content into a preview tease without coupling the modal
    // to <Canvas>.
    useEffect(() => {
        if (!open) return
        document.body.classList.add('upsell-open')
        return () => document.body.classList.remove('upsell-open')
    }, [open])

    useModalEscape(dismiss, open)

    // Reset payment + auth-bridging state on close so a re-open starts fresh.
    useEffect(() => {
        if (open) return
        setClientSecret(null)
        setIntentError(null)
        setOpenedAuthFromUpsell(false)
    }, [open])

    // Auto-close AuthModal once the upsell-triggered sign-in completes,
    // bringing the user back to this surface for the payment step.
    useEffect(() => {
        if (openedAuthFromUpsell && authStatus === 'authenticated') {
            setAuthOpen(false)
            setOpenedAuthFromUpsell(false)
        }
    }, [openedAuthFromUpsell, authStatus, setAuthOpen])

    // If the user becomes premium while the modal is open (e.g., another
    // tab completed the purchase, or they were already premium and the
    // gate fired on stale state), short-circuit the success path.
    useEffect(() => {
        if (open && authStatus === 'authenticated' && isPremium) {
            completePurchase()
        }
    }, [open, authStatus, isPremium, completePurchase])

    // Fetch the PaymentIntent client_secret once we have an authenticated
    // user. Re-runs if `clientSecret` is reset (retry button) or `intentError`
    // is cleared. NOTE: don't track in-flight via a state setter inside this
    // effect — toggling state-in-deps re-fires the effect, which trips its
    // own cleanup and cancels the in-flight fetch before setClientSecret
    // can run. The `clientSecret || intentError` guards make it idempotent
    // enough on their own.
    useEffect(() => {
        if (!open) return
        if (authStatus !== 'authenticated') return
        if (clientSecret || intentError) return

        let cancelled = false
        ;(async () => {
            try {
                const result = await createPaymentIntent()
                if (cancelled) return
                if (result.alreadyPremium) {
                    completePurchase()
                    return
                }
                if (!result.clientSecret) throw new Error('Server returned no client_secret')
                setClientSecret(result.clientSecret)
            } catch (e) {
                if (cancelled) return
                setIntentError(
                    e instanceof Error ? e.message : 'Failed to start checkout'
                )
            }
        })()
        return () => {
            cancelled = true
        }
    }, [open, authStatus, clientSecret, intentError, completePurchase])

    // Stripe.js promise — cached at module scope, so the useMemo is just
    // for stable React identity.
    const stripePromise = useMemo(() => getStripe(), [])

    if (!open || !copy) return null

    return (
        // No backdrop-click dismiss: in Arcade the dismiss callback ends
        // the run, and a stray click outside the card would silently
        // forfeit the player's progress. Esc and the explicit "Maybe
        // later" button are the only ways out.
        <ModalOverlay
            intensity="heavy"
            layer="stats"
            aria-hidden={!open}
        >
            <GlassCard
                width={460}
                maxWidth="92%"
                maxHeight="92dvh"
                overflow="scroll"
                alignItems="stretch"
                gap="$5"
            >
                <YStack gap="$2" alignItems="center">
                    <SubLabel>One-time unlock</SubLabel>
                    <ModalTitle>{copy.headline}</ModalTitle>
                </YStack>

                <BodyText tone="body" textAlign="center">
                    {copy.subhead}
                </BodyText>

                <PriceBlock />

                {authStatus !== 'authenticated' && (
                    <YStack gap="$3" alignItems="stretch">
                        <BodyText tone="muted" textAlign="center" fontSize="$3">
                            Create an account first — your unlock rides with the account, so it follows you across devices.
                        </BodyText>
                        <HudButton
                            tone="primary"
                            size="lg"
                            onPress={() => {
                                setOpenedAuthFromUpsell(true)
                                setAuthOpen(true)
                            }}
                            alignSelf="stretch"
                        >
                            <HudButton.Text tone="primary" size="md">
                                Create your unlock account
                            </HudButton.Text>
                        </HudButton>
                    </YStack>
                )}

                {authStatus === 'authenticated' && intentError && (
                    <YStack gap="$3" alignItems="stretch">
                        <BodyText tone="danger" textAlign="center" fontSize="$3">
                            {intentError}
                        </BodyText>
                        <HudButton
                            tone="primary"
                            size="lg"
                            onPress={() => {
                                setIntentError(null)
                                setClientSecret(null)
                            }}
                            alignSelf="stretch"
                        >
                            <HudButton.Text tone="primary" size="md">Retry</HudButton.Text>
                        </HudButton>
                    </YStack>
                )}

                {authStatus === 'authenticated' && !intentError && !clientSecret && (
                    <BodyText tone="muted" textAlign="center" fontSize="$3">
                        Loading checkout…
                    </BodyText>
                )}

                {authStatus === 'authenticated' && !intentError && clientSecret && (
                    <Elements
                        stripe={stripePromise}
                        options={{
                            clientSecret,
                            appearance: { theme: 'night' },
                        }}
                    >
                        <PaymentForm onComplete={completePurchase} />
                    </Elements>
                )}

                <HudButton onPress={dismiss} alignSelf="center">
                    <HudButton.Text tone="muted">Maybe later</HudButton.Text>
                </HudButton>
            </GlassCard>
        </ModalOverlay>
    )
}
