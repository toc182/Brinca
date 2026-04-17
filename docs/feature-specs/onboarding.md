# Feature spec — Onboarding

**Screen name:** Onboarding
**File:** `docs/feature-specs/onboarding.md`
**Last updated:** April 10, 2026
**Status:** Draft
**Related docs:** `docs/product-vision.md`, `docs/ux-conventions.md`

---

## Purpose

Onboarding exists to get a new user from zero to their first session in the shortest path possible. By the end of onboarding, the user has a working account, at least one child profile, and at least one named activity — enough to log their first session immediately.

---

## Entry points

- App launched for the first time on a new account — onboarding starts automatically
- Returning user who is logged out — sees login screen, not onboarding
- User with an existing account — never sees onboarding again

---

## Flow overview

Onboarding is a linear 3-step wizard (email verification is inline in Step 1, not a separate step). The user cannot skip onboarding — the app is unusable without completing it. A back button is available on every step so the user can correct mistakes.

```
Step 1 — Create account
    ↓
[Email/password only] → Email verification screen → Step 2
[Sign in with Apple / Google] → Step 2 directly
    ↓
Step 2 — Add first child
    ↓
Step 3 — Name first activity
    ↓
Home screen
```

If the user closes the app mid-onboarding, progress is saved and they resume from where they left off on next launch.

---

## Step 1 — Create account

### What the screen shows
- App logo and name
- "Sign in with Apple" button (⚠️ to be implemented — backend not yet configured)
- "Sign in with Google" button (⚠️ to be implemented — backend not yet configured)
- Divider: "or"
- Email field
- Password field
- Display name field (the user's own name, not the child's)
- "What best describes you?" selector: Parent / Therapist / Coach / Teacher / Other. This is persona data for future personalization — it does not affect permissions. Family permission roles (Admin, Co-admin, Collaborator, Member) are managed separately in Accounts Center.
- Terms of service checkbox: "I agree to the [Terms of Service] and [Privacy Policy]" (links open in-app browser)
- "Create account" button → disabled until all fields are valid and checkbox is checked
- "Already have an account? Sign in" link at the bottom

### Password requirements
Displayed below the password field as soon as the user starts typing. Each requirement checks off in real time as it is met:

- [ ] At least 8 characters
- [ ] One uppercase letter
- [ ] One number
- [ ] One special character (!@#$%...)

The "Create account" button stays disabled until all 4 requirements are met.

### Email/password flow
After tapping "Create account" → app sends a verification email → user sees the email verification screen.

**Email verification screen:**
- Message: "We sent a verification link to [email]. Check your inbox to continue."
- "Resend email" button (available after 30 seconds)
- "Change email" link → returns to Step 1 with email field pre-filled
- The user cannot proceed until they tap the verification link in their email
- Once verified → automatically advances to Step 2

### Social login flow
- Sign in with Apple or Google → no email verification required → advances directly to Step 2
- If the social account email already exists in the system → log in to existing account, skip onboarding

---

## Step 2 — Add first child

### What the screen shows
- Step indicator (e.g. "Step 2 of 3")
- Back button (top left)
- Heading: "Who are you tracking?"
- Child photo → circular placeholder with a camera icon. Tap to open photo picker (camera or library). Optional.
- Child name field (required, max 50 characters)
- Date of birth field → date picker (required)
- Gender selector: Male / Female / Prefer not to say (required)
- "Continue" button → disabled until name, DOB, and gender are filled

### Notes
- Photo is optional — the user can skip it and add it later from the child's profile
- DOB is stored for future use (age-based achievements and benchmarks)
- Gender is stored for future use (personalized language and benchmarks)

---

## Step 3 — Name first activity

### What the screen shows
- Step indicator (e.g. "Step 3 of 3")
- Back button (top left)
- Heading: "What will you be practicing?"
- Subheading: "You can configure drills and exercises after setup."
- Activity name field (required, max 50 characters)
- Placeholder text in field: "e.g. Baseball, Therapy Exercises, Multiplication"
- "Get started" button → disabled until activity name is filled

### Notes
- Only the activity name is collected here — drill configuration happens after onboarding
- When the user lands on Home, an empty state guides them to add their first drill

---

## Completion

After tapping "Get started" on Step 3:
- Account, child profile, and activity are saved
- User lands on the Home screen
- Home shows the newly created child as the active child
- The activity appears with an empty state: "No drills yet. Add your first drill to start practicing." with an "Add drill" button

---

## Edge cases

| Edge case | Expected behavior |
|---|---|
| Email already registered | Inline error below email field: "An account with this email already exists." |
| Invalid email format | Inline error below email field: "Please enter a valid email address." |
| Password requirements not met | "Create account" button stays disabled. Requirements checklist shows which are unmet. |
| Terms checkbox not checked | "Create account" button stays disabled. |
| Network unavailable at Step 1 (account creation) | "Create account" button is disabled. Toast: "You're offline. An internet connection is required to create your account." Account creation and email verification both require a network connection — onboarding cannot proceed offline. Steps 2 and 3 (child profile and first activity) save locally and sync later. |
| User closes app mid-onboarding | Progress saved. On next launch, resumes from the step they were on. |
| Child name left empty | "Continue" button stays disabled. |
| Activity name left empty | "Get started" button stays disabled. |
| User picks a profile photo that is too large | Show inline error: "Photo is too large. Please choose a smaller image." |
| Verification email not received | User can tap "Resend email" after 30 seconds. |
| User taps verification link after it expires | Show error screen: "This link has expired. Please request a new one." with "Resend email" button. |

---

## Data written by this screen

**Account creation:**
- User ID (auto-generated)
- Email
- Display name
- Persona type (parent / therapist / coach / teacher / other) — stored for future personalization, does not affect permissions
- Created at timestamp

**Child profile:**
- Child ID (auto-generated)
- Family ID (linked to user's family)
- Name
- Date of birth
- Gender
- Avatar URL (optional — local URI until Supabase Storage is configured)

**First activity:**
- Activity ID (auto-generated)
- Name
- Child ID
- Created at timestamp

---

## Acceptance criteria

**Account creation**
- [ ] "Create account" button is disabled until email, password, display name, persona selector, and terms checkbox are all complete
- [ ] Password requirements checklist appears below the password field as soon as the user starts typing
- [ ] Each password requirement checks off in real time as it is met
- [ ] Submitting with an already-registered email shows inline error: "An account with this email already exists."
- [ ] Submitting with an invalid email format shows inline error: "Please enter a valid email address."
- [ ] Terms of service and privacy policy links open in an in-app browser
- [ ] After successful email/password account creation, the email verification screen is shown
- [ ] "Resend email" button is disabled for 30 seconds after sending, then becomes available
- [ ] After email verification, the user automatically advances to Step 2
- [ ] Sign in with Apple and Google buttons are visible on the screen (⚠️ to be implemented)
- [ ] Social login skips email verification and advances directly to Step 2

**Step 2 — Add first child**
- [ ] "Continue" button is disabled until name, DOB, and gender are all filled
- [ ] Tapping the photo placeholder opens the device photo picker (camera or library)
- [ ] Photo is optional — "Continue" is enabled without a photo
- [ ] Back button returns to Step 1 with all previously entered data intact

**Step 3 — Name first activity**
- [ ] "Get started" button is disabled until activity name is filled
- [ ] Back button returns to Step 2 with all previously entered data intact
- [ ] Placeholder text is visible in the activity name field when empty

**Completion**
- [ ] After tapping "Get started", the user lands on the Home screen
- [ ] The newly created child is shown as the active child on Home
- [ ] The new activity appears with an empty state prompting the user to add their first drill
- [ ] Onboarding never appears again for this account after completion

**Resuming**
- [ ] If the app is closed mid-onboarding, progress is saved
- [ ] On next launch, onboarding resumes from the step the user was on

---

## Open questions

- [ ] Should the persona selector (parent, therapist, coach, teacher, other) affect anything in V1 — UI language, defaults, onboarding hints — or is it purely stored for future personalization?
- [ ] What is the maximum password length? Minimum is 8 characters.
- [ ] Should "Sign in with Apple" be displayed more prominently than "Sign in with Google"? Apple HIG requires Sign in with Apple to be at least as prominent as any other social login.
- [ ] What happens if a user tries to sign in with Google using an email that already exists as an email/password account — merge accounts or show an error?
- [ ] What happens if a returning social login user opens the app — does it check whether onboarding was completed, or does it always skip onboarding?
- [ ] Should the app support account deletion from within the app? This may be required for COPPA compliance and is required by Apple App Store guidelines.
- [ ] COPPA compliance deadline is April 22, 2026. Does onboarding need a specific parental consent flow for children's data beyond the terms of service checkbox?
- [ ] Avatar photos currently save as local URIs and will break on device change or reinstall. Supabase Storage must be configured before launch. Should onboarding warn the user about this limitation, or fix it silently in the backend?
- [ ] After completing onboarding with one child, is there a prompt to add more children, or does the user discover that later on their own?
- [ ] Do activities have a photo or icon that the user sets during setup, or is that added later from the activity configuration screen?

---

## Mockups

[Link to Figma file — to be added after design phase]
