# Rewards, levels, streaks, and accolades — Brinca

> Rules of the game. This document defines how currency is earned, how rewards are configured and redeemed, how levels and streaks are computed, and what accolades exist. It is cross-cutting — multiple screens render these values, but the mechanics live here.

**Last updated:** April 15, 2026
**Owner:** Ivan
**Status:** Draft
**Related docs:** [`product-vision.md`](product-vision.md), [`feature-specs/home-dashboard.md`](feature-specs/home-dashboard.md), [`feature-specs/session-logging.md`](feature-specs/session-logging.md), [`feature-specs/activity-builder.md`](feature-specs/activity-builder.md), [`feature-specs/stats.md`](feature-specs/stats.md)

---

## 1. Purpose

Four systems — currency, rewards, levels, streaks, accolades — appear on the Home dashboard, the Session Summary, the Stats tab, and the (not-yet-specced) Rewards screen. Defining them in each feature spec would duplicate the rules and cause drift. This document is the single source of truth. Feature specs reference it.

---

## 2. Currency

### 2.1 Name
Each family sets a custom currency name (default: "Coins"). The name is a per-family preference stored alongside measurement units.

### 2.2 Sources
Currency is earned in exactly three ways:

1. **Drill-level tier rewards** — highest qualifying tier on each completed drill during a session.
2. **Session-level tier rewards** — highest qualifying tier evaluated against the session as a whole.
3. **Manual bonuses** — parent-awarded amounts (preset or custom) with a typed reason.

Configuration of all three lives in [`feature-specs/activity-builder.md`](feature-specs/activity-builder.md). This document defines only how they are evaluated and recorded.

### 2.3 Evaluation timing
All tier rewards are evaluated and committed when the parent taps **Finish Session**, not at the moment each drill is finished. The Session Summary screen is a reveal — the child sees what was earned after the session ends.

Manual bonuses added during a session or on the summary screen are committed at the same moment (when Finish Session / Done is tapped) and share the same ledger entry batch.

### 2.4 Manual bonuses vs earned currency
Manual bonuses and earned currency are **merged** in the balance and in history displays. No visual distinction. The ledger stores the reason, which provides traceability for anyone reading history, but the UI treats one Coin as one Coin regardless of source.

### 2.5 Ledger
Every currency event is recorded as a ledger entry with:
- child_id
- amount (positive = earned, negative = spent on reward redemption)
- source (`drill_tier`, `session_tier`, `manual_bonus`, `reward_redemption`)
- reference id (drill_id, session_id, reward_id — depending on source)
- reason (free text; required for manual bonuses, auto-filled for other sources)
- timestamp

The child's **balance** is the sum of all ledger entries for that child. It is not stored as a separate counter.

### 2.6 Session deletion and currency
Deleting a session in V1 does **not** reverse its ledger entries. Per [`feature-specs/stats.md`](feature-specs/stats.md), the child's balance is unaffected by session deletion. This is a deliberate V1 choice to avoid negative balances and awkward reversals. May be revisited in V2.

---

## 3. Tier rewards — evaluation rules

Tier configuration is defined in [`feature-specs/activity-builder.md`](feature-specs/activity-builder.md). This section adds the evaluation rules that were previously unspecified.

### 3.1 Highest qualifying tier wins
A drill or session may have many tiers ("Perfect", "Great", "Good"). If more than one qualifies, the child earns **only the one with the highest currency amount**. Tiers do not stack. If two tiers have the same amount, the tier defined first (lowest display order) wins — this is a deterministic tiebreaker, not a user-facing feature.

### 3.2 Conditions referencing missing elements
A tier condition references a specific tracking element. If that element has been deactivated or deleted after the tier was configured, the condition **is skipped** during evaluation. The remaining conditions in the tier's AND-chain are evaluated; if any of them pass, the tier qualifies.

Example: tier "Perfect" requires "Consecutive Catches ≥ 100 AND High Balls ≥ 5". If "High Balls" is deactivated, the rule reduces to "Consecutive Catches ≥ 100". A session with 120 catches earns "Perfect".

If **every** condition in a tier references a missing element, the tier is skipped entirely (no award).

This rule applies to both drill-level and session-level tiers.

---

## 4. Rewards (savings goals)

A reward is a goal the child saves coins toward — a video game, a glove, a trip for ice cream. It has a name and a currency cost.

### 4.1 Multiple concurrent rewards
A child may have any number of rewards configured at the same time. The parent chooses what exists and what it costs. Home displays the **closest** one — defined as the reward with the smallest remaining gap (`cost - current_balance`). If two rewards tie, the one with the lower cost wins the tiebreaker.

### 4.2 Reward states
Each reward is in one of three states:

| State | Enter condition | Exit condition |
|---|---|---|
| `saving` | Reward created | Balance reaches or exceeds cost |
| `ready_to_redeem` | Balance ≥ cost | Parent taps Redeem |
| `redeemed` | Parent taps Redeem | (terminal — one-time earn per reward) |

A reward is **one-time**. Once redeemed, it is archived. To repeat the same goal, the parent creates a new reward.

### 4.3 Redemption
Redemption is manual. When a reward enters `ready_to_redeem`, the child's balance is **not** deducted automatically. The parent completes the real-world purchase or gesture, then taps **Redeem** on the Rewards screen. Only then does the ledger record a negative entry equal to the reward's cost, and the reward moves to `redeemed`.

Rationale: the child earning enough coins and the parent delivering the real-world reward are two different events. Deducting coins on balance crossover would make the child feel robbed between the two events.

### 4.4 Balance above cost
The balance can exceed a reward's cost. The child continues earning past the threshold. At redemption, the cost is deducted from whatever balance exists at that moment — any excess remains available for the next goal.

### 4.5 Deleting a reward
If the parent deletes a reward that is currently `saving` or `ready_to_redeem`, the child's balance is preserved. The goal is gone; the coins stay. No ledger entry is created for the deletion.

### 4.6 Celebration moments
Two distinct UI moments, both TBD in the design pass:

**Moment A — Threshold crossing on the Session Summary screen.**
When a session's committed earnings push the balance across a reward's cost for the first time, the Session Summary displays a highlight: "You can now redeem [reward]!" Soft visual, no modal. Triggers once per reward — after redemption, a new reward crossing its threshold triggers again.

**Moment B — Redemption on the Rewards screen.**
When the parent taps Redeem, a full celebration animation plays. If this is the child's first-ever redemption, the "Big Win" accolade unlocks at the same moment.

Final animation designs are pending — per [`plan.md`](plan.md) celebration animations use react-native-reanimated and will be finalized during the Figma design pass.

---

## 5. Levels

### 5.1 Basis
Levels are based on **total sessions completed** for that child. Currency earned does not factor in for V1. Incomplete sessions do not count — only sessions finalized via Finish Session.

### 5.2 Thresholds
Accelerating curve, global for all children (not per-child customizable in V1):

| Level | Sessions required (cumulative) |
|---|---|
| 1 | 0 |
| 2 | 3 |
| 3 | 8 |
| 4 | 15 |
| 5 | 25 |
| 6 | 40 |
| 7 | 60 |
| 8 | 80 |
| 9 | 100 |
| 10 | 120 |
| 11+ | +20 per level (140, 160, 180…) |

From Level 6 onward, each level requires 20 more sessions than the previous. There is no ceiling.

### 5.3 Badge
The badge upgrades visually at every level. For V1 this must be a **programmatic** visual (color progression, shape variation, additive small elements) — custom art per level is out of scope for the design pass. The specific visual language is TBD during the Figma work referenced in [`docs/design/`](design/).

### 5.4 Level progress
Progress toward the next level is computed as `sessions_completed - threshold(current_level)` divided by `threshold(next_level) - threshold(current_level)`, rendered as a progress bar on Home.

### 5.5 Session deletion and level
Deleting a session **does** recompute the child's level if the deletion drops the session count below a threshold. A child at Level 4 with 15 sessions who deletes one session becomes Level 3 until another session is logged. The level is always derived from the current session count — not stored.

---

## 6. Streaks

### 6.1 Definition
A streak is the count of **consecutive calendar days** on which the child completed at least one session. Calendar days are measured in the user's **local timezone** at the time of the session.

### 6.2 Scope
Streaks are **per child**. A family with two children has two independent streaks. Sessions logged by different family members for the same child all count toward the same streak.

### 6.3 Breaking
Missing a single day breaks the streak. If today is Tuesday and the last session was Sunday, the streak is broken regardless of how long it was. Freeze/grace mechanics are V2.

### 6.4 Visibility
The current streak is visible on the Home dashboard near the active child header — a small indicator (e.g. 🔥 5). When the streak is 0, the indicator is hidden. Exact placement is TBD during the design pass. See [`feature-specs/home-dashboard.md`](feature-specs/home-dashboard.md).

### 6.5 Derivation
The streak is **not stored**. It is computed from the child's session history on every read. This falls out of rule 6.6.

### 6.6 Session deletion and streaks
Deleting a session retroactively affects the streak. If deletion removes the only session on a given day, that day becomes a gap, and any streak that spanned it is broken. This is why the streak must be derived — a stored counter could not be kept correct without complex reversal logic.

---

## 7. Accolades

### 7.1 Model
Accolades are one-time, permanent, per-child achievements. Once unlocked, they never un-unlock. The three tiers (Starter / Milestone / Long-game) are purely organizational — they control visual grouping in the accolades screen, not mechanics.

### 7.2 Evaluation
Accolade unlocks are evaluated at the same moment as currency — when the parent taps Finish Session. The engine checks each not-yet-unlocked accolade against the child's cumulative state and unlocks any whose rule is now satisfied. Streak and balance accolades use the derived values (see sections 6.5, 2.5).

One accolade ("Big Win") is also evaluated on the Rewards screen at the moment of redemption — the only non-session trigger.

### 7.3 Catalog (V1)

| Name | Description | SF Symbol | Unlock rule | Tier |
|---|---|---|---|---|
| First Steps | You finished your very first session! | `shoe.fill` | Complete 1 session total | Starter |
| Coin Catcher | You earned your first coin! | `dollarsign.circle.fill` | First ledger entry with positive amount | Starter |
| Drill Starter | You knocked out your first drill! | `checkmark.circle.fill` | Complete 1 drill total (Finish drill tapped) | Starter |
| Goal Setter | You picked out your first reward to save for! | `gift.fill` | Configure your first reward | Starter |
| Big Win | You earned your very first reward! | `star.fill` | First reward redeemed | Starter |
| Warm-Up | You came back for session number two! | `sparkles` | Complete 2 sessions total | Starter |
| On a Roll | You practiced 5 days in a row! | `flame.fill` | Reach a 5-day current streak | Milestone |
| Week Warrior | You crushed 5 sessions this week! | `calendar.badge.checkmark` | Complete 5 sessions in the current calendar week | Milestone |
| Deep Focus | You stayed locked in for a 30-minute session! | `brain.head.profile` | Complete a session lasting 30 minutes or more | Milestone |
| Double Digits | You hit 10 sessions — that's real practice! | `10.circle.fill` | Complete 10 sessions total | Milestone |
| Drill Master | You've finished 100 drills! | `target` | Complete 100 drills total | Milestone |
| Level Up | You reached level 5! | `arrow.up.circle.fill` | Reach Level 5 | Milestone |
| Unstoppable | You practiced 30 days in a row! | `bolt.fill` | Reach a 30-day current streak | Long-game |
| Iron Streak | You hit a 100-day streak — unreal! | `shield.lefthalf.filled` | Reach a 100-day current streak | Long-game |
| Half a Thousand | You completed 500 drills! | `figure.run` | Complete 500 drills total | Long-game |
| Century Club | You logged session number 100! | `rosette` | Complete 100 sessions total | Long-game |
| Treasure Hunter | You've banked 10,000 coins over time! | `crown.fill` | Cumulative positive ledger amount ≥ 10,000 | Long-game |

17 accolades total. "Personal Best" was in an earlier draft and is **dropped from V1** — personal records require drill-level performance tracking that is in `Later / not scheduled` per [`product-vision.md`](product-vision.md).

### 7.4 Definitions
- **"Drill completed"** = parent tapped Finish drill on the drill screen during a session (per [`feature-specs/session-logging.md`](feature-specs/session-logging.md)). A drill with no tracking elements where the parent tapped Mark complete also counts.
- **"Session completed"** = parent tapped Finish Session and the summary was saved. Incomplete sessions (user left mid-session, battery died, etc.) do not count.
- **"Current week"** = the calendar week in the user's local timezone, starting Sunday. A session logged Saturday 11:59 PM counts for that week; 12:01 AM Sunday starts a new week.
- **"Cumulative positive ledger amount"** = sum of all positive-amount ledger entries (excludes redemptions). "Treasure Hunter" tracks lifetime earned, not current balance.

### 7.5 Session deletion and accolades
Unlocked accolades are **permanent**. Deleting a session does not revoke accolades, even if the deletion drops the child below the threshold that originally unlocked it. Rationale: revoking achievements feels worse than keeping a slightly inconsistent state, and the scenarios where this matters are rare.

---

## 8. Schema implications

This section is non-binding guidance for the future [`docs/architecture/04-database-schema.md`](architecture/04-database-schema.md) — not a schema itself.

- **Currency ledger table** — one row per earn/spend event, fields listed in 2.5. Balance is `SUM(amount)` grouped by child.
- **Rewards table** — fields: id, child_id, name, cost, state (`saving | ready_to_redeem | redeemed`), created_at, redeemed_at (nullable). Redemption writes a corresponding negative ledger row.
- **Accolades unlocks table** — composite key (child_id, accolade_id), unlocked_at timestamp. One row per unlocked accolade. The accolade catalog itself (17 items) can be a static array in code, not a DB table.
- **No level table** — derived from session count.
- **No streak table** — derived from session history.

---

## 9. Open questions

- [ ] The Rewards screen itself is not yet specced. It is implied by [`feature-specs/home-dashboard.md`](feature-specs/home-dashboard.md) (tap reward progress → rewards screen) and is needed to build redemption. Write as `feature-specs/rewards.md` before Phase 4.
- [ ] Badge visual language for levels — resolved during the Figma pass, not before.
- [ ] "Week Warrior" starts the week on Sunday. Confirm this matches Panamanian convention or switch to Monday.
- [ ] Accolade UI on Session Summary — is there an animation when one unlocks during a session, or is the summary-screen reveal static? Deferred to design pass.
- [ ] If a child is deleted, are their rewards, ledger entries, and accolade unlocks deleted in cascade? Expected yes, but belongs in the schema doc.
