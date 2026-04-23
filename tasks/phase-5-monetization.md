# Phase 5 — Monetization

Requires Phase 4 (modes) to exist first. The gates are meaningless without the modes.

Price: **$2.99 one-time unlock**. Daily puzzle is always free. No subscriptions, no energy timers.

---

## 5.1 Unlock State in Persistence

- [ ] Add `isPremium: boolean` to the persistence schema
- [ ] Default to `false`; set to `true` on successful purchase
- [ ] All gate checks read from this single flag — no per-feature flags

## 5.2 Depth Gates

- [ ] Arcade: when player reaches 9×9 and `!isPremium`, intercept with upsell screen instead of loading the puzzle
- [ ] Library: when player tries to unlock a tier above the free threshold and `!isPremium`, intercept with upsell screen
- [ ] Upsell screen: brief pitch + price + purchase button; dismissible (player returns to where they were)

## 5.3 Payment Integration

- [ ] Choose payment provider: Stripe (web-native, easy integration) is the default choice
- [ ] Build a server-side webhook or serverless function to verify payment and return a signed token or set a flag
- [ ] On successful payment, set `isPremium = true` in persistence and dismiss the upsell screen
- [ ] Restore purchase flow: if player clears localStorage, provide a way to re-verify their purchase (email lookup or receipt ID)
- [ ] Test the full flow: upsell → payment → unlock → gate lifted
