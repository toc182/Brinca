# Compliance audit — Onboarding

**Feature:** Onboarding
**Spec:** `docs/feature-specs/onboarding.md`
**Date:** 2026-04-21
**Auditor:** Claude (automated)
**Status:** Not spec-complete

---

## 1. Summary

Out of approximately 40 discrete spec requirements, roughly 19 PASS, 6 are PARTIAL, and 15 are MISSING — placing overall compliance at ~48%. The biggest gaps are: the entire email verification flow is absent (account creation skips straight to Step 2), social login buttons exist on the Login screen but are missing from the Step 1 screen (where the spec places them), the "Already have an account? Sign in" link is missing from Step 1, there is no app logo on Step 1, Terms of Service / Privacy Policy are not clickable links that open an in-app browser, the child photo picker is non-functional (displays an Avatar but has no tap-to-pick behavior), the child name field has no 50-character max enforcement, no network-offline handling exists, and mid-onboarding resume is not implemented. **This feature is not spec-complete — the primary email/password flow is broken (no verification step) and several secondary requirements are missing.**

---

## 2. Gap table

| # | Spec requirement | Status | Severity | Gap description | File(s) |
|---|---|--------|----------|-----------------|---------|
| 1 | Email verification screen after email/password account creation | MISSING | CRITICAL | Spec requires: after "Create account" -> email verification screen with "Resend email" (30s cooldown), "Change email" link, auto-advance on verification. Code skips directly to Step 2 on success -- no verification screen exists at all. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:63-68` |
| 2 | "Resend email" button disabled for 30 seconds after sending | MISSING | CRITICAL | No email verification screen exists, so this is entirely absent. | -- |
| 3 | After email verification, user automatically advances to Step 2 | MISSING | CRITICAL | No verification polling/listener implemented. | -- |
| 4 | "Sign in with Apple" button on Step 1 | MISSING | CRITICAL | Spec places social login buttons on Step 1 (the create-account screen). They exist on the Login screen instead. Step 1 has no social login buttons. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx` |
| 5 | "Sign in with Google" button on Step 1 | MISSING | CRITICAL | Same as above -- exists on Login screen, absent from Step 1. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx` |
| 6 | Social login skips email verification -> advances directly to Step 2 | MISSING | CRITICAL | No social login on Step 1, no verification flow -- entire path missing. | -- |
| 7 | Divider "or" between social buttons and email form on Step 1 | MISSING | MEDIUM | The divider exists on the Login screen but not on Step 1 where the spec places it. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx` |
| 8 | App logo and name on Step 1 | MISSING | MEDIUM | Spec says Step 1 shows "App logo and name." Step 1 shows "Step 1 of 3" and "Create your account" but no logo. The logo is on the Login screen instead. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:89-90` |
| 9 | "Already have an account? Sign in" link at bottom of Step 1 | MISSING | MEDIUM | Spec requires this link on the create-account screen. Not present. The inverse ("Create account" link) exists on the Login screen. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx` |
| 10 | Terms of Service and Privacy Policy as tappable links that open in-app browser | PARTIAL | MEDIUM | Spec: "I agree to the [Terms of Service] and [Privacy Policy]" with links opening in-app browser. Code shows plain text with no tappable links -- "Terms of Service" and "Privacy Policy" are not Link or Linking.openURL elements. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:167-172` |
| 11 | Child photo: circular placeholder with camera icon, tap to open photo picker (camera or library) | PARTIAL | MEDIUM | Code renders `<Avatar>` component but it is not wrapped in a Pressable and has no onPress handler -- tapping does nothing. No photo picker integration (no expo-image-picker import). | `src/features/onboarding/screens/OnboardingStep2Screen.tsx:76-78` |
| 12 | Child name max 50 characters | MISSING | MEDIUM | Spec says "max 50 characters." No maxLength prop or validation on the child name input. | `src/features/onboarding/screens/OnboardingStep2Screen.tsx:79-85` |
| 13 | Network unavailable at Step 1: button disabled + toast "You're offline..." | MISSING | MEDIUM | No network connectivity check. The spec says account creation requires network and should show a specific offline toast. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx` |
| 14 | Mid-onboarding resume: progress saved, resume from current step on next launch | MISSING | MEDIUM | No persistence of onboarding progress. Steps pass familyId/childId via route params only -- closing the app loses this state. The setAuthState calls exist but there is no logic to restore step position from persisted auth state on cold start. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx`, `src/features/onboarding/screens/OnboardingStep2Screen.tsx` |
| 15 | If social account email already exists -> log in, skip onboarding | MISSING | LOW | Social login not implemented on Step 1. | -- |
| 16 | User taps expired verification link -> error screen with "Resend email" | MISSING | LOW | No verification flow at all. | -- |
| 17 | Photo too large -> inline error "Photo is too large..." | MISSING | LOW | No photo picker, so no size validation. | -- |
| 18 | Invalid email format -> inline error "Please enter a valid email address." | PARTIAL | MEDIUM | Code only checks `email.includes('@')` for button disablement. No inline error message for invalid format is shown -- the button just stays disabled. Spec says an inline error should appear. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:45` |
| 19 | Email already registered -> inline error below email field | PASS | -- | Implemented: catches "already registered" in error message and sets emailError state. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:72-74` |
| 20 | Email field present | PASS | -- | Present. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:92-101` |
| 21 | Password field present | PASS | -- | Present. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:103-110` |
| 22 | Display name field present | PASS | -- | Present, labeled "Your name." | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:128-135` |
| 23 | "What best describes you?" persona selector with 5 options | PASS | -- | All 5 options present: Parent, Therapist, Coach, Teacher, Other. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:15-21` |
| 24 | Terms of service checkbox present | PASS | -- | Checkbox present with appropriate text. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:160-172` |
| 25 | "Create account" button disabled until all fields valid + checkbox checked | PASS | -- | isValid checks email, password rules, displayName length, personaType, and agreedToTerms. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:44-49` |
| 26 | Password requirements checklist appears when user starts typing | PASS | -- | Shown when `password.length > 0`. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:112-126` |
| 27 | Password requirements check off in real time | PASS | -- | Each rule has a test() function, met rules show checkmark with green color. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:114-124` |
| 28 | 4 password rules: 8 chars, uppercase, number, special char | PASS | -- | All 4 rules defined. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:23-28` |
| 29 | Step 2: step indicator "Step 2 of 3" | PASS | -- | Present. | `src/features/onboarding/screens/OnboardingStep2Screen.tsx:72` |
| 30 | Step 2: back button | PASS | -- | Provided by Stack navigator in onboarding _layout.tsx (headerShown: true). | `app/(auth)/onboarding/_layout.tsx:9-10` |
| 31 | Step 2: heading "Who are you tracking?" | PASS | -- | Present. | `src/features/onboarding/screens/OnboardingStep2Screen.tsx:73` |
| 32 | Step 2: child name field (required) | PASS | -- | Present with required prop. | `src/features/onboarding/screens/OnboardingStep2Screen.tsx:79-85` |
| 33 | Step 2: date of birth field with date picker | PASS | -- | Present with DateTimePicker. | `src/features/onboarding/screens/OnboardingStep2Screen.tsx:87-107` |
| 34 | Step 2: gender selector with 3 options | PASS | -- | Male, Female, Prefer not to say. | `src/features/onboarding/screens/OnboardingStep2Screen.tsx:16-20` |
| 35 | Step 2: "Continue" disabled until name, DOB, gender filled | PASS | -- | isValid checks all three. | `src/features/onboarding/screens/OnboardingStep2Screen.tsx:33` |
| 36 | Step 2: photo is optional -- "Continue" enabled without photo | PASS | -- | isValid does not check avatar. | `src/features/onboarding/screens/OnboardingStep2Screen.tsx:33` |
| 37 | Step 3: step indicator "Step 3 of 3" | PASS | -- | Present. | `src/features/onboarding/screens/OnboardingStep3Screen.tsx:58` |
| 38 | Step 3: heading "What will you be practicing?" | PASS | -- | Present. | `src/features/onboarding/screens/OnboardingStep3Screen.tsx:59` |
| 39 | Step 3: subheading "You can configure drills and exercises after setup." | PASS | -- | Present. | `src/features/onboarding/screens/OnboardingStep3Screen.tsx:60-62` |
| 40 | Step 3: activity name field with placeholder text | PASS | -- | Placeholder: "e.g. Baseball, Therapy Exercises, Multiplication" -- matches spec. | `src/features/onboarding/screens/OnboardingStep3Screen.tsx:68` |
| 41 | Step 3: "Get started" disabled until activity name filled | PASS | -- | Checks `activityName.trim().length >= 2`. | `src/features/onboarding/screens/OnboardingStep3Screen.tsx:27` |
| 42 | Step 3: activity name max 50 characters | PARTIAL | LOW | Validation exists (length <= 50 in isValid and inline error displayed), but no maxLength prop to prevent typing beyond 50. The spec says "max 50 characters" -- debatable whether inline error suffices vs. hard limit. | `src/features/onboarding/screens/OnboardingStep3Screen.tsx:27, 71-74` |
| 43 | Completion: user lands on Home screen | PASS | -- | `setAuthState('authenticated')` triggers routing to tabs. | `src/features/onboarding/screens/OnboardingStep3Screen.tsx:42` |
| 44 | Completion: newly created child shown as active child on Home | PASS | -- | `useActiveChildStore.getState().setActiveChild()` called in create-child mutation. | `src/features/onboarding/mutations/useCreateChildMutation.ts:42` |
| 45 | Step 2: back button returns to Step 1 with data intact | PARTIAL | LOW | Stack navigator provides back button, but Step 1 uses local useState -- navigating back creates a fresh component instance. Previously entered data is lost unless React Navigation keeps the screen mounted (depends on Stack behavior). Not guaranteed. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx` |
| 46 | Step 3: back button returns to Step 2 with data intact | PARTIAL | LOW | Same issue -- Step 2 uses local useState. Data may not persist on back navigation. | `src/features/onboarding/screens/OnboardingStep2Screen.tsx` |
| 47 | Login screen: returning users see login, not onboarding | PASS | -- | Login screen exists as the default auth route. | `src/features/onboarding/screens/LoginScreen.tsx` |
| 48 | Onboarding never appears again after completion | PASS | -- | `setAuthState('authenticated')` persists -- auth routing prevents re-entry. | -- |
| 49 | Step 1 shows "Step 1 of 3" indicator | EXTRA | -- | Spec does not mention a step indicator on Step 1 (it says "App logo and name"). The step label is present but the logo/name is not. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:89` |
| 50 | Step 3: minimum activity name length of 2 characters | EXTRA | -- | Spec says "disabled until activity name is filled" -- code requires length >= 2 which is stricter than "filled" (length >= 1). Minor. | `src/features/onboarding/screens/OnboardingStep3Screen.tsx:27` |
| 51 | Login screen has social login buttons | EXTRA | -- | Spec places social buttons on Step 1, not Login. Having them on Login is architecturally different -- Login is for returning users, not new accounts. | `src/features/onboarding/screens/LoginScreen.tsx:49-63` |
| 52 | Terms text includes COPPA guardian consent language | EXTRA | -- | Spec's checkbox text is simpler. The code adds: "If I add a child to this account, I confirm I am that child's parent or legal guardian, or I have permission to record information about the child." This is not in the spec but may be a compliance addition. | `src/features/onboarding/screens/OnboardingStep1Screen.tsx:168-171` |
| 53 | DOB date picker minimumDate set to 2010 | EXTRA | -- | Spec doesn't specify min/max dates. Code sets minimumDate to Jan 1 2010 which prevents tracking children older than ~16. May be intentional but not in spec. | `src/features/onboarding/screens/OnboardingStep2Screen.tsx:101` |

---

## 3. UX conventions compliance

- **Navigation model:** PASS -- Onboarding uses a Stack navigator with back buttons. Route files are thin wrappers delegating to `src/features/` screen components. Tab bar is not shown during onboarding (correct).

- **Error states:** PARTIAL -- Inline error exists for "email already registered" (correct pattern). But the invalid email format case shows no inline error (just disables button). Generic errors use `showToast('error', ...)` which follows the toast pattern. However, the toast calls pass raw strings or translation keys inconsistently -- Step 2's onError passes `'error.generic'` as a literal string instead of through `t()`.

- **Loading states:** FAIL -- No loading indicators during account creation, child creation, or activity creation. The buttons disable via isPending (good), but there is no spinner, skeleton, or any visual feedback that the operation is in progress. UX conventions specify a spinner for "long unpredictable actions."

- **Empty states:** N/A -- Onboarding screens don't have empty states by nature.

- **Destructive confirmations:** N/A -- No destructive actions in onboarding flow.
