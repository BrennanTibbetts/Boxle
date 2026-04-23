# Phase 6 — Leaderboard

Requires backend infrastructure. This is the only phase that can't be built as a pure client-side feature. Do this last — ship and validate everything else first.

---

## 6.1 Backend & Auth Infrastructure

- [ ] Choose hosting: Cloudflare Workers + D1 (SQLite at edge) is a lightweight fit for this scale
- [ ] Decide auth model: anonymous with device ID, or account-based (email/OAuth)?
  - Anonymous is lower friction but can't restore across devices
  - Account-based enables social features and cross-device sync
- [ ] Define the API surface: submit score, fetch leaderboard (global top N, player's rank)
- [ ] Set up the backend project, CI, and deployment pipeline

## 6.2 Daily Solve Leaderboard

- [ ] On daily session complete, submit: player ID, date, solve time, hints used, lives remaining
- [ ] Backend validates the score (basic sanity check: time > minimum possible, date matches server date)
- [ ] Leaderboard query: top 100 for today's date, plus the current player's rank
- [ ] Display on the end screen: "You ranked #47 today" with a link to the full board
- [ ] Leaderboard view: scrollable list, highlight the current player's row

## 6.3 Arcade High-Score Leaderboard

- [ ] On run end, submit: player ID, depth score (grid size reached), timestamp
- [ ] Global all-time top scores (not date-scoped)
- [ ] Display personal best vs. global top in the Arcade mode end screen
- [ ] Consider a weekly reset to keep competition fresh (TBD)
