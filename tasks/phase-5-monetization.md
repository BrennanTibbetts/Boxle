# Phase 5 — Monetization

Requires Phase 4 (modes) to exist first. The gates are meaningless without the modes.

Price: **$2.99 one-time unlock**. Daily puzzle is always free. No subscriptions, no energy timers.

---

## 5.1 Unlock State in Persistence

- [ ] Add `isPremium: boolean` to the persistence schema
- [ ] **Always `false` locally** in the web (no-account) path — localStorage cannot grant premium. The field exists in the schema so the shape matches the future backend/account path 1:1 (see [PRODUCT_DIRECTION.md](../PRODUCT_DIRECTION.md) "Accounts & Persistence")
- [ ] Gate checks read `isPremium` from the authoritative source: the auth layer / server when an account is linked, the (always-false) local flag otherwise. Do **not** let DevTools-flipping localStorage unlock gates

## 5.2 Depth Gates

Phase 4 already stubbed the gate hook (`src/utils/gates.ts` — `canPlayAt(size, mode)` currently returns `true` for everything). Phase 5 replaces the body.

**Placeholder thresholds** (revisit after playtesting — starting permissive to surface the full content):
- Arcade: free up to **10×10**; paid unlocks **11×11 through 15×15**
- Library: free through **tier 7 (7×7)**; paid unlocks **tiers 8 and above**

- [ ] Replace `canPlayAt` body: return `false` when `!isPremium` and `size > threshold` for the given mode
- [ ] Arcade: on next-size transition, if gate rejects, show upsell screen instead of loading the next puzzle (run does not end — "subscribe to keep going")
- [ ] Library: on tier-unlock attempt, if gate rejects, show upsell screen
- [ ] Upsell screen: brief pitch + price + purchase button; dismissible (player returns to where they were)

## 5.3 Payment Integration

- [ ] Choose payment provider: Stripe (web-native, easy integration) is the default choice
- [ ] Build a server-side webhook or serverless function to verify payment and return a signed token or set a flag
- [ ] On successful payment, set `isPremium = true` in persistence and dismiss the upsell screen
- [ ] Restore purchase flow: if player clears localStorage, provide a way to re-verify their purchase (email lookup or receipt ID)
- [ ] Test the full flow: upsell → payment → unlock → gate lifted
