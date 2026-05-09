import { supabase } from './supabase'
import { runSync } from './sync'
import usePersistence from '../stores/usePersistence'

interface CreatePaymentIntentOk {
    already_premium?: boolean
    client_secret?: string
    payment_intent_id?: string
}

export interface PaymentIntentResult {
    alreadyPremium: boolean
    clientSecret: string | null
    paymentIntentId: string | null
}

// Calls the boxle-backend `create-payment-intent` Edge Function. Caller
// must already be signed in — supabase.functions.invoke attaches the JWT
// automatically.
export async function createPaymentIntent(): Promise<PaymentIntentResult> {
    const { data, error } = await supabase.functions.invoke<CreatePaymentIntentOk>(
        'create-payment-intent',
        { body: {} }
    )
    if (error) throw error
    if (!data) throw new Error('Empty response from create-payment-intent')

    return {
        alreadyPremium: !!data.already_premium,
        clientSecret: data.client_secret ?? null,
        paymentIntentId: data.payment_intent_id ?? null,
    }
}

// After confirmPayment succeeds, the Stripe webhook is what flips
// profiles.is_premium server-side. Webhook delivery is async — usually
// sub-second, but Stripe gives no SLA — so the client polls runSync until
// the value reflects through, with a bounded retry budget.
export async function waitForPremium(
    userId: string,
    {
        maxAttempts = 10,
        delayMs = 800,
    }: { maxAttempts?: number; delayMs?: number } = {}
): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await runSync(userId)
        if (usePersistence.getState().isPremium) return true
        await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
    return usePersistence.getState().isPremium
}
