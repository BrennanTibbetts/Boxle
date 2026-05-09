import { loadStripe, type Stripe } from '@stripe/stripe-js'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!publishableKey) {
    throw new Error(
        'Missing VITE_STRIPE_PUBLISHABLE_KEY. Set it in .env.local for dev or in Vercel env vars for prod.'
    )
}

// Single in-flight load — Stripe.js is global, loading it twice produces a
// console warning and a duplicate sentry beacon.
let stripePromise: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
    if (!stripePromise) {
        stripePromise = loadStripe(publishableKey!)
    }
    return stripePromise
}

// Display price — the *server* is the source of truth on the actual amount
// charged (UNLOCK_PRICE_CENTS in boxle-backend/_shared/stripe.ts). This is
// only what we render in the upsell pitch. Keep them in sync manually.
export const UNLOCK_PRICE_LABEL = '$2.99'
