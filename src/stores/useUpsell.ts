import { create } from 'zustand'

export type UpsellReason = 'infinite-depth' | 'library-tier'

interface UpsellOptions {
    reason: UpsellReason
    // Called when the player closes the modal without unlocking. The caller
    // wires the appropriate consequence here — Infinite ends the run, Library
    // bounces back to the tier picker.
    onDismiss?: () => void
    // Called after a successful purchase. Caller continues the action that
    // hit the gate (Infinite advances to the next size; Library enters the
    // tier batch). Phase 7 payment integration calls this; until then the
    // path is unreachable from production builds.
    onPurchaseSuccess?: () => void
}

interface UpsellStore {
    open: boolean
    reason: UpsellReason | null
    onDismiss: (() => void) | null
    onPurchaseSuccess: (() => void) | null
    openUpsell: (opts: UpsellOptions) => void
    dismiss: () => void
    completePurchase: () => void
}

export default create<UpsellStore>((set, get) => ({
    open: false,
    reason: null,
    onDismiss: null,
    onPurchaseSuccess: null,
    openUpsell: ({ reason, onDismiss, onPurchaseSuccess }) =>
        set({
            open: true,
            reason,
            onDismiss: onDismiss ?? null,
            onPurchaseSuccess: onPurchaseSuccess ?? null,
        }),
    dismiss: () => {
        const cb = get().onDismiss
        set({ open: false, reason: null, onDismiss: null, onPurchaseSuccess: null })
        cb?.()
    },
    completePurchase: () => {
        const cb = get().onPurchaseSuccess
        set({ open: false, reason: null, onDismiss: null, onPurchaseSuccess: null })
        cb?.()
    },
}))
