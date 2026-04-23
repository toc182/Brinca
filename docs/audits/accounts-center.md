# Compliance Audit — Accounts Center

**Audited:** 2026-04-21
**Spec:** `docs/feature-specs/accounts-center.md` (last updated April 13, 2026)
**UX conventions:** `docs/ux-conventions.md` (last updated April 17, 2026)
**Audited files:**
- `src/features/accounts-center/screens/AccountsCenterScreen.tsx`
- `src/features/accounts-center/mutations/useDeleteAccountMutation.ts`
- `app/(settings)/_layout.tsx`
- `app/(settings)/index.tsx`
- `app/(settings)/accounts-center/index.tsx`

---

## 1. Summary

The Accounts Center implementation is at a **very early scaffold stage** — roughly **15–20% compliance** with the spec. Only three capabilities exist: a read-only display of name/email, a measurement-unit toggle, and a two-step delete-account flow. The entire Profile section is non-interactive (no photo, no edit modals, no change-password). The Family section is a placeholder — no member list, no invite flow, no member detail screen. The Account section is missing social-login stubs. Screen states (loading skeleton, offline banner, error/retry) are entirely absent. The delete-account flow deviates from spec (uses two native alerts instead of alert + type-"DELETE" confirmation). **Verdict: not shippable against the spec — major implementation work remains.**

---

## 2. Gap table

| # | Spec requirement | Status | Severity | Gap description | File(s) |
|---|---|--------|----------|-----------------|---------|
| 1 | Profile photo displayed, tappable to change via system photo picker | MISSING | CRITICAL | No photo element exists. No initials placeholder. No photo picker integration. | `AccountsCenterScreen.tsx` |
| 2 | Display name tappable → opens edit modal (pre-filled, max 50 chars, Save disabled until changed, Cancel/swipe dismiss, toast "Changes saved.") | MISSING | CRITICAL | Name is displayed as a read-only `InfoRow`. Not tappable. No modal exists. | `AccountsCenterScreen.tsx` |
| 3 | Email tappable → opens edit modal (requires current password, validation, verification email, toast) | MISSING | CRITICAL | Email is displayed as a read-only `InfoRow`. Not tappable. No modal exists. | `AccountsCenterScreen.tsx` |
| 4 | Change password row → opens modal (current + new + confirm, real-time requirement checklist, inline errors, toast) | MISSING | CRITICAL | No "Change password" row exists anywhere on the screen. | `AccountsCenterScreen.tsx` |
| 5 | Initials placeholder when no photo is set | MISSING | MEDIUM | No avatar or initials element. | `AccountsCenterScreen.tsx` |
| 6 | Family section header: "Family" | PARTIAL | LOW | Section header reads "Family Settings" instead of "Family". | `AccountsCenterScreen.tsx:71` |
| 7 | Measurement units — inline toggle: Metric / Imperial | PASS | — | Toggle exists using `Switch`, reads/writes `measurementUnit` via Zustand store. | `AccountsCenterScreen.tsx:73-86` |
| 8 | Family members list (photo/initials, name, role label) | MISSING | CRITICAL | Placeholder text "Coming soon" instead of actual list. | `AccountsCenterScreen.tsx:88-94` |
| 9 | Tapping a family member → opens detail screen (stack push) | MISSING | CRITICAL | No member rows, no navigation. | — |
| 10 | Admin's own row is not tappable | MISSING | CRITICAL | No member rows exist. | — |
| 11 | "Invite member" button → opens modal (email + role picker) | MISSING | CRITICAL | No invite button or modal. | — |
| 12 | Role system (Admin / Co-admin / Collaborator / Member) | MISSING | CRITICAL | No role logic implemented. | — |
| 13 | Admin can invite Co-admin, Collaborator, Member; Co-admin can invite Collaborator, Member only | MISSING | CRITICAL | No invite flow. | — |
| 14 | Invite sends email, toast "Invite sent to [email]." | MISSING | CRITICAL | No invite flow. | — |
| 15 | Inviting existing family member → inline error | MISSING | CRITICAL | No invite flow. | — |
| 16 | Inviting invalid email → inline error | MISSING | CRITICAL | No invite flow. | — |
| 17 | Family member detail screen (photo, name, email, role, "Change role" button, "Remove from family" button) | MISSING | CRITICAL | No detail screen file exists. No route defined for it. | — |
| 18 | Change role → bottom sheet with available roles, applies immediately, toast "Role updated." | MISSING | CRITICAL | No detail screen. | — |
| 19 | Admin can change any role; Co-admin can change Collaborators/Members only | MISSING | CRITICAL | No role logic. | — |
| 20 | Remove from family → native iOS alert with specific message, toast "Member removed." | MISSING | CRITICAL | No detail screen. | — |
| 21 | Co-admin rows not tappable for other Co-admins | MISSING | CRITICAL | No member rows. | — |
| 22 | Sign in with Apple — visible but disabled, "Coming soon" label | MISSING | MEDIUM | No social login buttons. | `AccountsCenterScreen.tsx` |
| 23 | Sign in with Google — visible but disabled, "Coming soon" label | MISSING | MEDIUM | No social login buttons. | `AccountsCenterScreen.tsx` |
| 24 | Delete account — first confirmation: native iOS alert with title "Delete your account?" and specific message text | PARTIAL | MEDIUM | Alert exists but title is "Delete account" (missing "your"). Message text deviates: says "all children profiles" instead of "all children's profiles, all session data, and remove all family members." | `AccountsCenterScreen.tsx:40-44` |
| 25 | Delete account — second confirmation: text field requiring user to type "DELETE" | MISSING | CRITICAL | Second step is another native alert, not a text-input confirmation. Spec requires typing "DELETE". | `AccountsCenterScreen.tsx:46-52` |
| 26 | Account deletion removes all data and returns to login screen | PARTIAL | MEDIUM | Mutation signs out, clears local data, navigates to login. But does not trigger server-side data deletion (comment acknowledges this is deferred to Edge Function). | `useDeleteAccountMutation.ts` |
| 27 | Loading state: skeleton with shimmer animation | MISSING | CRITICAL | No loading state. Screen renders immediately with hardcoded values. | `AccountsCenterScreen.tsx` |
| 28 | Offline state: subtle offline banner, cached data shown, network-dependent actions blocked with toast | MISSING | CRITICAL | No offline detection, no banner, no toast blocking. | `AccountsCenterScreen.tsx` |
| 29 | Error state: "Something went wrong. Please try again." with retry button | MISSING | CRITICAL | No error state handling. | `AccountsCenterScreen.tsx` |
| 30 | Entry point: Settings → Accounts Center button | PASS | — | Route exists at `(settings)/accounts-center/index`. Settings screen presumably links to it. | `_layout.tsx:35`, `accounts-center/index.tsx` |
| 31 | Entry point: Child switcher bottom sheet → "Go to Accounts Center" | NOT AUDITED | LOW | Outside scope of files listed, but noted for completeness. | — |
| 32 | Profile data sourced from parent profile (not hardcoded) | MISSING | CRITICAL | `displayName` is hardcoded to `'Parent'`, `email` to `''`. No data fetching. | `AccountsCenterScreen.tsx:29-30` |
| 33 | Pending invites visible in family list (open question — deferred) | MISSING | LOW | Open question in spec; no implementation regardless. | — |
| 34 | Invite revocation (open question — deferred) | MISSING | LOW | Open question in spec. | — |
| 35 | Invite expiration (open question — deferred) | MISSING | LOW | Open question in spec. | — |

---

## 3. UX conventions compliance

- **Navigation model:** PASS — Accounts Center is a stack-pushed screen inside the `(settings)` Stack navigator, which matches the spec's "stack navigation" requirement. Back navigation works via standard stack pop.

- **Error states:** FAIL — No error state implemented. Spec and UX conventions require "Something went wrong. Please try again." with a retry button. The screen has zero error handling.

- **Loading states:** FAIL — No skeleton/shimmer loading state. UX conventions require skeleton placeholders for screens loading lists or dashboards. The screen renders immediately with hardcoded static data.

- **Empty states:** FAIL — No empty state for the family members list. UX conventions require every screen that can have no data to show an empty state (icon + message + action button). The current "Coming soon" placeholder is not a proper empty state per the convention.

- **Destructive confirmations:** PARTIAL — Delete account uses native alerts (correct pattern per UX conventions for destructive actions), but deviates from spec: the second confirmation should require typing "DELETE" in a text field, not a second native alert. Alert copy also deviates from spec text.
