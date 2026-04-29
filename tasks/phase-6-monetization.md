# Phase 6 — Monetization

Requires Phase 4 (modes) and Phase 5 (mobile-friendly web) to ship first. Modes give the gates something to gate; mobile-web means the upsell actually converts on phones, which is where shared daily-results land.

Price: **$2.99 one-time unlock**. Daily puzzle is always free. No subscriptions, no energy timers.

---

## 5.1 Unlock State in Persistence

`isPremium: boolean` already lives in the persistence schema (Phase 4 — see [src/stores/usePersistence.ts](../src/stores/usePersistence.ts)). It's always `false` on the web (no-account) path; the field exists so the shape matches the future backend payload 1:1.

- [ ] Gate checks must read `isPremium` from the authoritative source: the auth layer / server when an account is linked, the (always-false) local flag otherwise. Do **not** let DevTools-flipping localStorage unlock gates

## 5.2 Depth Gates

Phase 4 already stubbed the gate hook ([src/utils/gates.ts](../src/utils/gates.ts) — `canPlayAt(size, mode)` currently returns `true` for everything) and wired it at the call sites:
- **Arcade**: checked in `ArcadeModeProvider`'s phase subscriber on next-size advance — rejection ends the run with the current `deepestSize`
- **Library**: checked in `LibraryTierPicker` per-tile to disable a tier card

Phase 6 replaces the body and changes the rejection paths from "end / disable" to "show upsell."

**Placeholder thresholds** (revisit after playtesting — starting permissive to surface the full content):
- Arcade: free up to **10×10**; paid unlocks **11×11 through 18×18** (the current Arcade cap)
- Library: free through **tier 7 (7×7)**; paid unlocks **tiers 8 and above** (up to 18)

- [ ] Replace `canPlayAt` body: return `false` when `!isPremium` and `size > threshold` for the given mode
- [ ] Arcade: on next-size transition, if gate rejects, show upsell screen instead of ending the run (run pauses — "subscribe to keep going")
- [ ] Library: on tier-entry attempt, if gate rejects, show upsell screen instead of just disabling the card
- [ ] Upsell screen: brief pitch + price + purchase button; dismissible (player returns to where they were)

## 5.3 Payment Integration

- [ ] Choose payment provider: Stripe (web-native, easy integration) is the default choice
- [ ] Build a server-side webhook or serverless function to verify payment and return a signed token or set a flag
- [ ] On successful payment, set `isPremium = true` in persistence and dismiss the upsell screen
- [ ] Restore purchase flow: if player clears localStorage, provide a way to re-verify their purchase (email lookup or receipt ID)
- [ ] Test the full flow: upsell → payment → unlock → gate lifted
