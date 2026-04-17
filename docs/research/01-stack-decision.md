# Stack Decision — Brinca

> Condensed from original research verified March 30, 2026. Updated with Feb-Mar 2026 ecosystem changes.

---

## Chosen Stack

### Frontend
- **React Native 0.83 + Expo SDK 55** (New Architecture mandatory — Legacy Architecture eliminated, no `newArchEnabled` option)
- **React 19.2**, **Hermes** engine (Hermes V1 available as opt-in via `useHermesV1` in `expo-build-properties`)
- **TypeScript** strict mode
- **Expo Router v5** (file-based routing, shipped with SDK 55 — there is no "v6", router versions align with the SDK). New Stack API with declarative React components, Native Tabs with Material Design 3, Apple Zoom Transition default on iOS.
- **Bun** (package manager)
- **expo-video** and **expo-audio** (expo-av removed in SDK 55)

### Backend
- **Supabase** — PostgreSQL + Auth + Storage + Edge Functions + Row Level Security
- **API keys:** `sb_publishable_xxx` in client, `sb_secret_xxx` in Edge Functions only. Legacy `anon`/`service_role` keys being phased out. OpenAPI spec via anon key deprecated — since April 8, 2026 all projects require service role or secret keys for `/rest/v1/`.
- **expo-sqlite** — local source of truth (offline-first)
- **MMKV** — fast key-value for UI state, timer persistence
- **expo-secure-store** — auth tokens only (never AsyncStorage)
- **Supabase Storage** — object listing up to 14.8x faster (March 2026 overhaul). Path traversal vulnerability patched.
- **Edge Functions** — 5,000 requests/min rate limit on recursive function-to-function calls. Deno runtime, not Node.js.

### State Management
- **TanStack Query v5** (v5.95+) — server state (Supabase data, cache, sync). Stable, no breaking changes.
- **Zustand v5** (v5.0.12) — client state (UI, forms, preferences). Persist middleware fixes for rehydration — update to v5.0.12.
- **React Hook Form** — form state
- **useState/useReducer** — ephemeral component state
- **Rule:** If it comes from Supabase → TanStack Query. If it's UI → Zustand. Never mix.

### DevOps and Quality
- **EAS Build** — ccache enabled (~30% faster builds, free for all plans). Build cache providers experimental.
- **EAS Update** — bytecode diffing reduces OTA downloads by ~75% (opt-in with `enableBsdiffPatchSupport`). `--environment` flag required — breaking change.
- **Sentry SDK 8** — crash reporting. Captures app start crashes natively (bridge setup, bundle loading, module init). Requires iOS 15.0+ (up from 11.0). Uses `useNativeInit` in Expo plugin and `sentry.options.json` for native-level init.
- **RevenueCat** — subscriptions (freemium model). Customer Center available for in-app subscription management.
- **Jest + React Native Testing Library** — unit/component tests
- **Maestro** — E2E tests
- **VS Code + Claude Code** — development
- **Expo Observe** (private preview) — production performance monitoring (cold/warm launch, TTFR, TTI, build comparison)

---

## Why These Choices

**React Native + Expo over Flutter:** JavaScript ecosystem (2.1M npm packages vs 48K pub.dev), lower learning curve (1-2 months vs 2-3), mature OTA updates via EAS Update, larger talent pool. Flutter has better animation performance (59 fps vs 51 fps under stress) but that's not the differentiator for this app.

**Supabase over Firebase:** The data model is inherently relational (families → children → activities → sessions → drills). PostgreSQL handles this naturally with JOINs and foreign keys. Firestore (NoSQL) would require denormalization and complex queries. Supabase's RLS solves multi-tenancy without application code. Trade-off: no native offline support — mitigated by expo-sqlite as local source of truth.

**Offline-first with expo-sqlite:** Write to SQLite first, UI responds immediately, background sync to Supabase when connected. More initial work than Firebase's native offline, but no vendor lock-in and more control over sync behavior.

**JSONB for flexible activity data:** Each activity type has different parameters. JSONB columns in sessions and activity config allow adding new types without schema changes. Both SQLite and PostgreSQL support JSON natively.

---

## Key Technical Patterns

**Timer:** Store `startTime` as `Date.now()` in MMKV. Calculate elapsed as `Date.now() - startTime`. Never accumulate — this survives app close and avoids drift.

**Media:** Store file path locally in SQLite. Upload to Supabase Storage on WiFi only. Show local file while upload is pending. Compress images to ~800px width before upload.

**Multi-tenancy:** RLS chain on all tables: `auth.uid()` → `family_members` → `family_id`. Use `(SELECT auth.uid())` for performance. SECURITY DEFINER functions to prevent recursion.

---

## Cost Projections

| Scale | Supabase | Expo/EAS | Sentry | Total/month |
|---|---|---|---|---|
| Development / 10 families | $0 | $0 | $0 | **$0** |
| Launch / 100 families | $0-25 | $0 | $0 | **$0-25** |
| Growth / 1,000 families | $35-50 | $0-29 | $0 | **$35-79** |
| Scale / 10,000 families | $100-200 | $29-99 | $26 | **$155-325** |

Media storage for 1,000 families with ~50GB: ~$10-15/month on Supabase Storage.

**Monetization:** Freemium with subscription ($3-5/month) for premium features. RevenueCat handles cross-platform subscriptions (free until $2,500/month revenue). No ads — safest for COPPA compliance. Note: hard paywalls convert ~5x better than freemium (10.7% vs 2.1% trial-to-paid per RevenueCat 2026 data). Apple now rejects toggle paywalls with free trial.

---

## COPPA Compliance

**Deadline: April 22, 2026 — $51,744 per violation per day.**

### Requirements
- Verifiable parental consent before collecting ANY data from children under 13 (credit card, government ID, or facial recognition)
- Data minimization — collect only what's necessary, no indefinite retention
- Zero behavioral advertising without separate parental consent
- SDK audit — review every third-party SDK (Sentry, RevenueCat) for data collection
- Biometric data explicitly protected
- Data collection for AI training never considered part of the service — requires separate parental consent

### Age Verification
- **FTC safe harbor (Feb 25, 2026):** Operators collecting personal info solely for age verification won't face enforcement if they meet 6 conditions: purpose limitation, data minimization/deletion, third-party safeguards, notice, reasonable security, reasonable accuracy. Applies to general/mixed audience only — not apps primarily targeting children.
- **Apple Declared Age Range API:** Returns age ranges (0-12, 13-15, 16-17, 18+) without exposing exact birthdate.
- **Google Play Age Signals API** (beta): Verification status and age ranges.

### App Store Requirements
- Apple: Kids category, no third-party ads, no data sent outside app without parental gate
- Google: Families policy compliance, IARC classification

### COPPA 2.0 (monitor)
Passed Senate unanimously (March 5, 2026). Extends protections to teens 13-16, prohibits targeted advertising to minors, requires "eraser button" for data deletion, lowers knowledge standard to "fairly implied on objective circumstances." Now in the House — previous attempts stalled there.

### State Laws
- Texas: Age verification required, effective January 2026
- Utah: Effective May 6, 2026
- Louisiana: Effective July 1, 2026

**Implementation:** Parental accounts with age verification in onboarding, subscription model (no ads), privacy-friendly analytics, consider COPPA Safe Harbor program (kidSAFE, PRIVO).
