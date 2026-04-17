# Readiness review — Brinca

## 1. Verdict

**Not yet — produce these first.** Confidence: **HIGH.** The product thinking, UX conventions, and architecture decision are unusually strong for a project at this stage, but three concrete artifacts that Luis Eduardo needs to open his editor don't yet exist, and one legal deadline (COPPA, April 22) is seven days away with no compliance plan written down. The good news: you are roughly two to three weeks of focused work away from "start building," not two to three months. The bad news: if you hand Luis Eduardo what you have today and say "go," he will stop within the first week on data-model questions and redo schema decisions that should be yours.

## 2. The gaps that matter — ranked

### Gap 1 — No canonical database schema or migration list

**Resolved.** Nothing in the backend exists yet — no Supabase project, no tables, no RLS, no auth. [`ux-conventions.md`](../ux-conventions.md) Section 7 correctly reflects this. The schema is now documented in [`docs/architecture/05-database-schema.md`](05-database-schema.md) — 20 tables covering every data structure referenced by the feature specs, with column definitions, ownership tree, RLS policy intent, cascade rules, JSONB value shapes for all 18 element types, and SQLite-vs-Supabase mapping. This is a starting reference that will evolve during implementation.

**Why it matters.** The architecture doc says Phase 1 creates `src/lib/sqlite/schema.ts` with "complete table definitions … to avoid migration debt." Luis Eduardo cannot write that file from the specs alone. Every feature spec assumes tables he will have to invent. He will invent them differently than you would have.

**What to produce.** A new document `docs/architecture/03-database-schema.md`. One section per table with columns, types, foreign keys, and a one-line "written by which feature, read by which feature" note. Include RLS policy summaries (not SQL, just intent). Add an ER diagram or a plain-text tree of ownership (`family → children → activities → drills → tracking_elements`; `children → sessions → drill_results → element_values`). The signal it is done: Luis Eduardo can read it end to end and sketch every CREATE TABLE without asking a question.

**Effort.** 2–3 working sessions (~8 hours total) with Luis Eduardo at your side asking "what happens if…" questions.

### Gap 2 — Rewards, levels, and accolades are undefined

**What it is.** [`home-dashboard.md`](../feature-specs/home-dashboard.md) lists level thresholds, the accolades catalog, and the currency-evaluation timing all as open questions. [`session-logging.md`](../feature-specs/session-logging.md) has the same open question about when rewards evaluate. The Session Summary screen is specced to "show rewards earned" but the math is not written down anywhere.

**Why it matters.** This is load-bearing for Home, Session Summary, Stats, and two database tables. It blocks anything after Phase 3 and touches UI in three features.

**What to produce.** A new document `docs/feature-specs/rewards-levels-accolades.md`. Sections: (a) how currency is earned per drill (exact formula and when it is committed — at "Finish drill" or "Finish Session"); (b) how tier evaluation picks the "highest qualifying tier" when two conditions both match; (c) the level-up formula — a simple table of "sessions × currency → next level" thresholds and whether thresholds are fixed or per-child; (d) the full accolade list for V1 (name, icon, unlock rule) — aim for 15–20 accolades; (e) rules for manual bonuses vs earned currency (distinguished on screen or not).

**Effort.** 1 working day. This is a product decision, not a spec — you can write it without Luis Eduardo.

### Gap 3 — Privacy and data handling plan

**Correction to the original review.** The April 22, 2026 COPPA deadline is **not a V1 blocker** for Brinca. COPPA is US federal law; Brinca launches in Panama first. The deadline becomes relevant only if and when the app is listed in the US App Store. The earlier framing overstated urgency — this entry has been rewritten to reflect the Panama-first launch.

**What it is.** No privacy policy, data retention statement, consent record, or SDK audit exists as a document. Apple requires a hosted privacy policy, in-app account deletion (already drafted in [`accounts-center.md`](../feature-specs/accounts-center.md)), and privacy nutrition labels regardless of launch market. Panamanian law (Ley 81 of 2019) imposes its own data-controller obligations.

**Why it matters.** The app cannot be submitted to the App Store without a privacy policy URL and privacy nutrition labels. Panamanian law requires a clear privacy notice in Spanish. Sentry and RevenueCat defaults must be audited before they receive production data linked to children.

**What to produce.** Resolved — see [`docs/compliance/privacy-and-data.md`](../compliance/privacy-and-data.md). Covers: data inventory, V1 consent mechanism (self-attestation checkbox with Spanish/English text), draft privacy policy in both languages, account deletion flow confirmation, SDK audit for Sentry and RevenueCat, data retention rules, and a separate US launch readiness checklist for the future COPPA trigger.

**Effort.** 1 day to draft; additional time for a Panamanian attorney to review before ship (a 1-hour consult is recommended).

### Gap 4 — Session-logging behavior for all 18 tracking element types

**Resolved.** [`session-logging.md`](../feature-specs/session-logging.md) now documents runtime behavior for all 18 element types (Counter sets was dropped from V1; the total went from 19 to 18). The new "Element behaviors" section covers each type's visual state, interactions, reset rule, saved shape, and target-met rule. Acceptance criteria were expanded to match, grouped by element category. Voice Note was kept in V1 and the privacy doc was updated to reflect microphone audio capture.

### Gap 5 — Design system tokens (`theme.ts`) not yet decided

**Resolved.** [`ux-conventions.md`](../ux-conventions.md) section 2 now contains a v0 token set: 12 color tokens (accent is a placeholder — iOS system blue — to be replaced with Brinca's brand color before ship), 11 typography styles on SF Pro, a 7-step spacing scale on a 4/8pt grid, 4 border-radius tokens, 3 shadow levels, and the 44pt touch-target minimum. Light mode only for V1. All values are marked as "v0 — will be refined during the Figma pass."

### Gap 6 — A small team working agreement

**Partially resolved.** A template exists at [`docs/team-workflow.md`](../team-workflow.md) with six sections: ownership, branching/PRs, definition of done, how open questions flow, cadence, and tools. Every decision point is a `[TBD]` field. Fill it in with Luis Eduardo in a 30-minute call before Phase 1 begins.

**Effort.** 30 minutes, once, with Luis Eduardo.

## 3. The first four weeks — a plan for Ivan

**Week 1 (this week — April 15–22).** Write [`docs/compliance/privacy-and-data.md`](../compliance/privacy-and-data.md) and lock the consent language in onboarding. Note: April 22 is not a hard deadline since V1 launches in Panama, not the US — treat this as normal Week-1 work, not emergency work. In parallel, write [`rewards-levels-accolades.md`](../rewards-levels-accolades.md). Do not start writing code yet.

**Week 2 (April 23–29).** With Luis Eduardo, hold two or three working sessions to produce `docs/architecture/03-database-schema.md`. This is the single most important document still missing. At the end of the week, rewrite the stale `agent_docs/` files (Section 5). Extend [`session-logging.md`](../feature-specs/session-logging.md) with the 15 missing element behaviors. Commit a v0 `theme.ts` inside [`ux-conventions.md`](../ux-conventions.md). Write the team workflow doc.

**Week 3 (April 30 – May 6) — the handoff moment.** Luis Eduardo opens his editor. Phase 1 of the architecture doc (project boots, four tabs render, SQLite opens). You are available same-day for questions. Clear signal it is safe to start: the schema document exists, rewards math is written, `theme.ts` v0 is committed, and COPPA compliance is filed.

**Week 4 (May 7–13).** Phase 2 — onboarding works end to end. You are now reviewing code against specs and answering open questions in real time, not writing new documents.

## 4. Things Ivan should not worry about yet

- **Push notifications, reminders, analytics charts beyond Stats v1, video upload, multi-language.** [`product-vision.md`](../product-vision.md) correctly puts all of these in V2.
- **Android parity.** Stack decision commits to iOS-only for V1 — do not revisit.
- **The paywall UI and subscription pricing.** Architecture Phase 5 notes RevenueCat SDK pipes up in Phase 5 — you do not need the paywall design yet.
- **Figma high-fidelity screens.** A v0 `theme.ts` is enough for Phase 1–3.
- **Personal records and drill-level performance charts.** Already in "Later / not scheduled" in [`product-vision.md`](../product-vision.md).
- **Choice of charting library.** [`02-project-structure.md`](02-project-structure.md) already commits Victory Native XL — nothing to revisit.
- **Audit trail in Accounts Center, invite expiration, pending invite visibility.** All flagged as open questions in [`accounts-center.md`](../feature-specs/accounts-center.md); safe to answer in Week 6–8.

## 5. Verdict on `agent_docs/` files

All resolved. The `agent_docs/` folder has been deleted.

| File | Action taken |
|---|---|
| `agent_docs/architecture.md` | **Deleted.** Superseded by [`02-project-structure.md`](02-project-structure.md). |
| `agent_docs/database_schema.md` | **Deleted.** Obsolete names, missing tables. Future schema doc written fresh from feature specs. |
| `agent_docs/offline_sync.md` | **Rewritten** into [`docs/architecture/04-offline-sync.md`](04-offline-sync.md). Expanded with sync queue structure, retry policy, conflict resolution, media sync flow, and read flow. |

Stale `@agent_docs/…` references in [`plan.md`](../plan.md) have been replaced with current doc paths.

## 6. Red flags in the existing documents

All red flags from the original review have been resolved:

- **"Drill" vs "Challenge" naming drift.** Resolved. `agent_docs/database_schema.md` (which used `challenges`) was deleted. All remaining docs use "drill." The future schema doc will use "drill" as the canonical term.
- **Onboarding — 3 steps or 4?** Resolved. [`onboarding.md`](../feature-specs/onboarding.md) now reads "3-step wizard (email verification is inline in Step 1, not a separate step)."
- **Activities scoped per-family or per-child?** Resolved. The deleted schema file was the only source of `activity_types.family_id`. Every feature spec consistently treats activities as per-child. The future schema doc should use `child_id` on the activities table.
- **"Activities are plugins"** in [`plan.md`](../plan.md). Resolved. The CLAUDE.md block now references tracking elements and points to `activity-builder.md` instead of the deleted `activity_plugins.md`.
- **Expo Router "v5" vs "v55".** Resolved. Standardized to "Expo Router v5 (shipped with SDK 55)" in [`plan.md`](../plan.md), [`01-stack-decision.md`](../research/01-stack-decision.md). [`product-vision.md`](../product-vision.md) and [`02-project-structure.md`](02-project-structure.md) already used "v5."
- **Offline onboarding contradiction.** Resolved. [`onboarding.md`](../feature-specs/onboarding.md) edge cases now state: Step 1 (account creation + email verification) requires a network connection — the Create account button is disabled offline. Steps 2 and 3 save locally and sync later.
- **Dangling CLAUDE.md references.** Resolved. The reference docs block in [`plan.md`](../plan.md) now points to existing files only: `02-project-structure.md`, `04-offline-sync.md`, `activity-builder.md`, `rewards-levels-accolades.md`, `privacy-and-data.md`, `plan.md`.

## 7. One thing Ivan should hear

You have produced, on your own, documentation that beats what 70% of funded startups have after six months. The architecture decision is sharp, the specs are consistent, the UX conventions are real. Do not skip the next three weeks out of excitement. The cost of Luis Eduardo starting on April 22 without a schema document is that he writes one and it becomes the schema — whether you agree with it or not. Spend fourteen more days writing, then let him build. The app will ship sooner because of it.
