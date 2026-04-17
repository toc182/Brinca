# UX conventions — Brinca

> Global patterns that apply to every screen and feature spec. When writing a feature spec, reference this file instead of redefining these patterns.

**Last updated:** 2026-04-17
**Owner:** Ivan
**Status:** Active — Brinca brand tokens applied. Dark mode deferred to V2.

---

## 1. Navigation model

### Tab bar
The primary navigation is a 4-tab bar at the bottom of the screen.

| Tab | Purpose |
|---|---|
| Home | Active child's dashboard — recent sessions, reward progress, streaks |
| Activity | Start a new session |
| Stats | Progress over time and access to previous sessions |
| Profile | Active child's profile + child switcher + activity configuration + settings |

### Stack navigation
Used when navigating deeper into existing content. A new screen slides in from the right with a back button in the top left. Going back reverses the animation — the current screen slides away to the right, revealing the previous screen. This is standard iOS stack behavior and applies everywhere: tabs, Settings sub-screens, session detail, etc. Example: Settings → Activities → tap an activity → back to activity list → back to Settings.

### Modals
Used for creating or editing something. A screen slides up from the bottom and covers the full screen.

**Dismissal:** swipe down or tap Cancel button (top left). Both are always available.

### Bottom sheets
Used for quick selections and supplementary information — when the user needs to make a choice or see additional context without leaving the current screen. Examples: selecting an activity to start, picking a date filter.

**Behavior:** draggable, swipe down to dismiss, drag handle visible at top.

### Native iOS alerts
Used exclusively for destructive confirmations — actions that cannot be undone. Examples: deleting a child profile, deleting an activity, abandoning a session.

**Format:** native iOS alert dialog with title, message, and two buttons. Destructive action button appears in red.

### Parent avatar
Displayed in the top right corner of every screen. Shows the parent's photo (circular, small) or initials if no photo is set. Tapping navigates to the Settings screen.

### Child switching
Lives in the Profile tab. The active child's photo and name are displayed at the top of the Profile screen — tapping opens a bottom sheet with the full list of children. Each row shows photo (or initials), name, and age. Active child has a checkmark. Selecting a different child dismisses the sheet and reloads all tabs with the new child's data. The bottom sheet also includes "Add child" (navigates to Settings) and "Go to Accounts Center" (navigates to the parent's account screen).

### Settings screen
Accessed by tapping the parent avatar (top right). Organized in grouped sections:

| Section | Contents |
|---|---|
| Accounts Center | Single button — opens parent account management screen (see `feature-specs/accounts-center.md`) |
| Activities | Single button — opens activity list and builder (see `feature-specs/activity-builder.md`) |
| Child (header: active child's name) | Edit profile — form (name, photo, DOB, country, gender, grade level). Measurements — weight/height history with "Add entry." External activities — list of non-tracked activities with "Add activity." |
| App | Help, Privacy, About, Log out |

**Log out behavior:** Native iOS alert: "Are you sure you want to log out?" with Cancel and Log out buttons. On confirmation, returns to login screen.

---

## 2. Design system — Brinca brand tokens

> **Light mode only for V1.** Dark mode tokens are included below for reference but deferred to V2.
>
> All values live in `src/shared/theme.ts` as the single source of truth — no hardcoded values anywhere else.

### 2.1 Color tokens — light mode

#### Primary

| Token | Hex | Usage |
|---|---|---|
| `primary-500` | `#6D4AE0` | Brand, primary CTAs, active tab, focus border |
| `primary-700` | `#4F33B3` | Pressed/hover state, small white text on surface |
| `primary-100` | `#E3DBFF` | Selected-card tint (kid) |
| `primary-50` | `#F2EEFF` | Selected-card tint (adult), hover background |

#### Interactive / supporting

| Token | Hex | Usage |
|---|---|---|
| `secondary-500` | `#14B8A6` | Mint supporting accent, calm surfaces |
| `secondary-50` | `#E6FAF6` | Info-adjacent tints |
| `accent-500` | `#FF8A3D` | Celebration, streak flame, reward highlights |
| `accent-400` | `#FFA366` | Gradient top stop for kid progress bars |
| `accent-600` | `#E5701F` | Gradient bottom stop, pressed accent |
| `accent-50` | `#FFF1E6` | Soft accent tint (kid highlights) |

#### Semantic

| Token | Hex | Usage |
|---|---|---|
| `error-500` | `#E11D48` | Icons, borders, strong error accents |
| `error-600` | `#C01A3F` | White text on error buttons (4.9:1 contrast) |
| `error-700` | `#9F1239` | Error text on light background (7.3:1 contrast) |
| `error-50` | `#FFE4EA` | Error toast / input background tint |
| `success-500` | `#059669` | Success icon / border |
| `success-600` | `#047857` | White text on success buttons (5.4:1 contrast) |
| `success-700` | `#065F46` | Success text on surface (7.1:1 contrast) |
| `success-50` | `#D1FAE5` | Success toast / badge tint |
| `warning-500` | `#D97706` | Warning icon / border |
| `warning-700` | `#92400E` | Warning text (6.9:1 contrast) |
| `warning-50` | `#FEF3C7` | Warning toast / badge tint |
| `info-500` | `#0284C7` | Info icon / border (distinct from violet primary) |
| `info-700` | `#075985` | Info text (7.2:1 contrast) |
| `info-50` | `#E0F2FE` | Info toast / badge tint |

#### Neutral / text

| Token | Hex | Usage |
|---|---|---|
| `text-primary` | `#1A1630` | Body text, headings — 16.5:1 on background |
| `text-secondary` | `#4B4865` | Subheadings, captions — 8.3:1 on background |
| `text-placeholder` | `#8B88A3` | Placeholder text — 3.3:1 (large text only) |
| `text-disabled` | `#A7A4BD` | Disabled labels |
| `text-on-primary` | `#FFFFFF` | White text on `primary-500` — 5.6:1 contrast |
| `border-default` | `#CCC9DB` | Input borders |
| `border-subtle` | `#E8E5F2` | Hairline dividers |

#### Surface

| Token | Hex | Usage |
|---|---|---|
| `background` | `#FAF8FF` | Screen background (barely-tinted lavender white) |
| `surface` | `#FFFFFF` | Cards, sheets, modals, inputs |
| `surface-disabled` | `#F4F3F8` | Disabled input / button background |
| `scrim` | `#0F0B1F` @ 40% | Modal / sheet overlay |

### 2.2 Color tokens — dark mode (V2)

| Token | Hex |
|---|---|
| `background` | `#0F0B1F` |
| `surface` | `#1A1433` |
| `surface-disabled` | `#231D3D` |
| `primary-500` | `#9B82FF` |
| `primary-700` | `#6D4AE0` |
| `primary-100` | `#2A2346` |
| `secondary-500` | `#2DD4BF` |
| `accent-500` | `#FFA366` |
| `error-500` | `#FB7185` |
| `success-500` | `#34D399` |
| `warning-500` | `#FBBF24` |
| `info-500` | `#38BDF8` |
| `text-primary` | `#F1EEFE` |
| `text-secondary` | `#B3AFC9` |
| `border-default` | `#3A3558` |
| `border-subtle` | `#2A2346` |
| `scrim` | `#000000` @ 60% |

### 2.3 Typography

Fonts loaded via `expo-font` from Google Fonts (all weights include Latin Extended: ñ, á, é, í, ó, ú, ü, ¿, ¡):

- `@expo-google-fonts/fredoka` — Display (variable, weights 400–600)
- `@expo-google-fonts/lexend` — Body (variable, weights 400–700; peer-reviewed +19.8% reading fluency in ages 7–12)
- `@expo-google-fonts/jetbrains-mono` — Timer (weight 500, tabular numerals)

**Rendering rules:** Enable Lexend `tnum` on stat tables at `bodySmall`/`caption`. Fredoka at 17pt and up only. Low-DPI Android (xhdpi/320dpi): prefer Lexend Medium below 13pt. Never `text-transform: uppercase` on Spanish labels (accent rendering inconsistent).

| Token | Font family | Size | Weight | Line height | Usage |
|---|---|---|---|---|---|
| `titleLarge` | Fredoka | 34 | 600 | 40 | Screen titles, hero numbers |
| `titleMedium` | Fredoka | 22 | 600 | 28 | Card titles, section headers |
| `titleSmall` | Lexend | 17 | 600 | 24 | Inline / group headers |
| `body` | Lexend | 17 | 400 | 24 | Default reading |
| `bodySmall` | Lexend | 15 | 400 | 22 | Secondary text |
| `caption` | Lexend | 13 | 500 | 18 | Metadata, labels |
| `captionSmall` | Lexend | 11 | 600 | 16 | Timestamps, legal only — avoid on kid views |
| `buttonLarge` | Lexend | 17 | 600 | 22 | Primary CTA |
| `buttonSmall` | Lexend | 15 | 600 | 20 | Secondary button |
| `counter` | Fredoka | 48 | 600 | 52 | Celebration big numbers |
| `timer` | JetBrains Mono | 40 | 500 | 44 | Tabular digits, stopwatch |

### 2.4 Spacing

4/8pt grid. All padding, margin, and gap values use these tokens.

Screen horizontal padding: `md` (16) on both sides — standard content inset.

| Token | Value | Common use |
|---|---|---|
| `xxxs` | 2 | Icon-to-text inside small buttons |
| `xxs` | 4 | Tight pairs |
| `xs` | 8 | Default small gap |
| `sm` | 12 | Form field row spacing |
| `md` | 16 | Card padding, section spacing |
| `lg` | 24 | Group separation |
| `xl` | 32 | Section separation |
| `xxl` | 48 | Hero spacing |
| `xxxl` | 64 | Kid celebration screens |

### 2.5 Border radius

Button rule: `radiusFull` for kid CTAs (pill shape), `radiusMd` for adult buttons.

| Token | Value | Usage |
|---|---|---|
| `radiusXs` | 4 | Chips, small tags, badges (adult) |
| `radiusSm` | 8 | Small cards |
| `radiusMd` | 12 | Cards, toasts, buttons (adult), modal inner |
| `radiusLg` | 16 | Sheets, hero cards, modal top corners |
| `radiusXl` | 24 | Kid celebration cards, achievement tiles |
| `radiusFull` | 9999 | Avatars, pills, kid-view CTA buttons |

### 2.6 Shadows

Shadow color is `#0F172A` (warm-tinted, not pure black). Always pair with a 1px `border-subtle` border on Android < 9.

| Token | shadowColor | Offset (x/y) | Blur | Opacity | Usage |
|---|---|---|---|---|---|
| `shadowNone` | — | — | — | — | No elevation; flat surfaces |
| `shadowSm` | `#0F172A` | 0 / 1 | 2 | 0.06 | Subtle elevation — list cards |
| `shadowMd` | `#0F172A` | 0 / 4 | 12 | 0.08 | Floating elements — bottom sheets, mini player |
| `shadowLg` | `#0F172A` | 0 / 12 | 24 | 0.12 | Modals, overlaid panels |
| `shadowXl` | `#0F172A` | 0 / 20 | 32 | 0.16 | Hero cards, full-screen overlays |

Dark mode: `shadowColor: '#000000'`, opacity 0.35–0.5; add `rgba(255,255,255,0.04)` 1pt top border.

### 2.7 Touch targets

Minimum spacing between adjacent targets: 8pt (adult), 12pt (kid).

| Context | Min size | Rule |
|---|---|---|
| `touchMin` — absolute minimum, adult data-dense | 44×44 pt | HIG floor — no exceptions |
| `touchAdult` — default adult UI | 48×48 pt | Use for all standard adult controls |
| `touchKid` — kid-facing primary (ages 10–12) | 56×56 pt | Kid-facing screens, primary actions |
| `touchKidLarge` — kid hero CTAs, onboarding (ages 7–9) | 64×64 pt | Onboarding, celebration CTAs |

### 2.8 Icons

- **Library:** `react-native-phosphor` (1,200+ icons, 6 weight variants)
- **Default stroke:** 1.5pt Regular
- **Weight variants:** Regular (default), Bold (active tabs), Duotone (achievements and kid hero surfaces only), Fill (destructive / status badges)
- **Standard sizes:** 16 (inline), 20 (body / list / toast), 24 (tab bar / nav), 32 (large actions / adult empty states), 48 (kid tiles / celebrations)

**Duotone rule:** Duotone weight is reserved for achievement icons and kid-hero surfaces only — do not use on adult data surfaces.

### 2.9 Animation

All motion wraps in a `ReduceMotion.System` check — fall back to instant state change when reduce-motion is enabled.

| Name | Type | Duration | Easing / Config | Usage |
|---|---|---|---|---|
| Stack push | timing | 300ms | `Easing.bezier(0.32, 0.72, 0, 1)` | Stack screen entrance |
| Stack pop | timing | 250ms | `Easing.bezier(0.4, 0, 1, 1)` | Stack screen exit |
| Modal slide-up | spring | — | mass:1, stiffness:180, damping:20 | Modal entrance |
| Sheet open | spring | — | mass:1, stiffness:200, damping:22 | Bottom sheet entrance |
| Sheet close | spring | — | mass:1, stiffness:160, damping:26 | Bottom sheet exit |
| Toast enter | spring | — | mass:0.8, stiffness:220, damping:18 | Toast entrance |
| Toast exit | timing | 200ms | `Easing.in(cubic)` | Toast exit |
| Button press (scale 0.96) | timing | 80ms | `Easing.out(quad)` | All button press |
| Button release — adult | spring | — | mass:0.6, stiffness:300, damping:22 (no bounce) | Adult button release |
| Button release — kid | spring | — | mass:0.6, stiffness:300, damping:15 (small bounce) | Kid button release |
| Counter / celebration bounce | spring | — | mass:1, stiffness:140, damping:8 (~8% overshoot) | Counter tap, goal hit |
| Hero celebration | sequence | 1800ms confetti | scale 0→1.1→1 mass:1.2 stiffness:110 damping:7 + confetti | Badge unlock, milestone |
| Checkmark draw | timing | 350ms | `Easing.bezier(0.65, 0, 0.35, 1)` | Checkbox completion |
| Tab icon active | spring | — | mass:0.8, stiffness:200, damping:15 — scale 1→1.1 | Tab bar icon tap |
| Progress ring fill | timing | 900ms | `Easing.out(cubic)` | Circular progress fill |
| List item stagger | spring | — | `FadeInDown.springify().damping(15).mass(1).stiffness(150).delay(i*40)` | List entrance |

### 2.10 Mascot — Capi the Capybara

Capi is a capybara character that appears on kid-facing surfaces to provide encouragement and context.

**Expression states (6 — no sad, no angry):**

| State | Context |
|---|---|
| Happy | Default, idle |
| Cheer | Session complete, goal hit — arms up, bounce pose, sparkle particles |
| Encouraging | Mid-session, streak save — thumbs up, eyes wide |
| Neutral / Thinking | Loading, empty state — looking up, pondering |
| Sleepy | Late night, rest day — eyes closed, ZZZ (signals rest is okay) |
| Celebratory | Major milestone, badge unlock — confetti, big grin, full-body Lottie |

**Where Capi appears (kid screens only):**
- Onboarding illustrations
- Kid-view empty states (uses "Neutral/Thinking" expression — see Section 4)
- Celebration animations (session complete, goals, streaks)
- Achievement / badge unlocks
- Reward / sticker-book
- Splash screen
- Push notifications to kid-profile devices

**Where Capi does NOT appear:**
- Adult dashboard
- Session logging forms and data entry
- Settings, account, billing, privacy
- Clinical notes and therapy documentation
- Data tables and weekly summaries (adult)
- Error alerts
- Permissions dialogs, auth
- Any screen likely to be screenshotted for medical records

**Constraint:** Capi has no sad or angry expressions. Never depict negative emotion states.

**Delivery:** Lottie JSON for idle + 6 states + hero celebration; static SVGs for empty states. Budget: ~250KB total. Respect `AccessibilityInfo.isReduceMotionEnabled` — fall back to static SVG.

---

## 3. Error handling

### Pattern
| Situation | Pattern |
|---|---|
| Form validation (required fields, invalid input) | Inline error — `error-700` (`#9F1239`) text below the field, using `caption` style (Lexend 13/18, weight 500) with a leading Phosphor `warning-circle` icon at 14pt in `error-600` |
| Success confirmations | Toast message — success variant (see toast pattern below) |
| Non-critical errors (sync, network) | Toast message — error or warning variant (see toast pattern below) |
| Destructive confirmations | Native iOS alert (see Navigation model) |

**Toast pattern (4 tiers):** Toasts follow a 4-variant system — `info`, `success`, `warning`, and `error`. Each variant has a distinct left-border color and Phosphor icon:

| Variant | Left-border token | Icon color token | Dismiss duration |
|---|---|---|---|
| Success | `success-500` | `success-600` | 4s |
| Info | `info-500` | `info-600` | 4s |
| Warning | `warning-500` | `warning-700` | 5s |
| Error | `error-500` | `error-600` | 6s |

### Standard error strings

**Network and sync:**
- Network unavailable — `"You're offline. Changes will sync when your connection is restored."`
- Sync failed — `"Couldn't sync. We'll try again shortly."`
- Generic server error — `"Something went wrong. Please try again."`
- Failed to save — `"Couldn't save. Please try again."`

**Success:**
- Session saved — `"Session saved."`
- Changes saved — `"Changes saved."`
- Child profile created — `"Profile created."`
- Activity created — `"Activity created."`

**Inline validation:**
- Required field empty — `"This field is required."`
- Name too long — `"Name must be under 50 characters."`

> Feature-specific error messages are defined in each feature spec.

---

## 4. Empty states

### Pattern
Every screen that can have no data must show an empty state. Never show a blank screen.

**Structure:** icon + short message + action button (where applicable)

- **Icon:** a single icon relevant to the screen's content. On kid-facing empty states, Capi (the mascot) replaces the generic icon, using the "Neutral/Thinking" expression state. Adult clinical and data screens use a Phosphor Duotone icon at 48pt instead.
- **Message:** one short sentence explaining what this screen is for
- **Action button:** a clear CTA telling the user what to do next (not always required — use only when there is an obvious next action)

**Tone:** inviting and actionable, never clinical or generic. Avoid "No data found."

> Specific empty state text for each screen is defined in each feature spec.

---

## 5. Loading states

| Situation | Pattern |
|---|---|
| Screens loading lists or dashboards (Home, Stats, Profile) | Skeleton with shimmer animation |
| Session logging actions (counter taps, checkboxes, timers) | Optimistic UI — update immediately, correct if failure |
| Long unpredictable actions (initial app load, media upload) | Spinner |

**Skeleton behavior:** placeholder shapes mimic the layout of the content about to appear. Shimmer animation sweeps left to right at 15–20° from vertical, 1500ms linear infinite. Skeleton base color: `shimmerBase` (`#E8E5F2`, violet-tinted). Shimmer highlight: `#F4F2FA` with an alpha gradient 0→0.6→0. Delay before showing: 200–300ms (skip on sub-300ms loads). Minimum display once shown: 400ms. With reduce-motion enabled, show static placeholder with no animation.

**Optimistic UI behavior:** the UI updates instantly on user action. If the action fails, the UI reverts and shows an error toast.

---

## 5b. Voice and microcopy

### Microcopy rules

1. **Use `tú`, never `usted`**, except on clinician, legal, billing, and verification screens. Never mix registers on a single screen.
2. **"Log out" → "Cerrar sesión"** — `sesión` means both login session and therapy session. Use `Cerrar sesión` for sign-out only. For therapy contexts, use `Empezar / Terminar sesión` with icon context. If ambiguous, prefer `actividad` or `práctica`.
3. **"Streak" → `Racha`** — keep it. Do not substitute with `serie` or `secuencia`.
4. **"Crushed it" → `¡Lo lograste!`** (pan-LatAm) or `¡La rompiste!` (Mexico/Argentina). Never translate literally.
5. **"Session" splits by role** — Sports: `sesión de entrenamiento`. Therapy: `sesión`. Kid-visible: `práctica` or `turno`.
6. **"Personal best" → `Récord personal` / `Tu mejor marca`** — "PB" has no recognition in Spanish.
7. **"Upgrade" → `Mejorar plan` or `Pasar a Premium`** — `Actualizar` means software update; do not use.
8. **Rewards use diminutives on kid screens** — `estampita` (sticker), `medallita` (medal). Use `insignia` on clinical exports only.

> **Register rule:** Default `tú` everywhere. Switch to `usted` only on clinician, legal, billing, and verification surfaces.

### Translation context rules

| Rule | When | English | Spanish |
|---|---|---|---|
| Sign-out action | Always | Log out | Cerrar sesión |
| Therapy / sport session | By role | Session | Sesión / práctica / turno (context-dependent) |
| Streak | Always | Streak | Racha |
| Informal achievement | Kid-visible | Crushed it | ¡Lo lograste! / ¡La rompiste! (regional) |
| Personal best | Stats screens | Personal best / PB | Récord personal / Tu mejor marca |
| Upgrade prompt | Adult only | Upgrade | Mejorar plan / Pasar a Premium |
| Sticker reward | Kid-visible | Sticker | Estampita |
| Medal reward | Kid-visible | Medal | Medallita |

---

## 6. Data persistence

| Context | Behavior |
|---|---|
| Session logging — mid-session | Auto-save every action immediately. No save button. Progress is never lost. |
| Session logging — end of session | Explicit "Finish Session" button to mark session complete and close it. |
| Creating or editing profiles and activities | Explicit Save button. Changes are not saved until the user confirms. |

---

## 7. Backend status

Nothing in the backend exists yet. No Supabase project, no schema, no RLS policies, no auth, no storage buckets, no edge functions. The entire backend is part of V1 scope and must be built before any feature can ship.

### To be built for V1
- Supabase project and environment setup
- Database schema — see `docs/architecture/04-database-schema.md` (pending)
- Row Level Security policies — chained through `family_members → family_id` per `docs/research/01-stack-decision.md`
- Auth — email/password with sessions persisted in expo-secure-store
- Sign in with Apple — required for App Store submission if any social login is offered
- Supabase Storage buckets — required for child profile photos and session photos

### V2 (not in scope for V1)
- Push notifications and reminders
- Edge functions
- OAuth providers beyond Apple
- Session media sync

> When writing feature specs, do not spec behavior that depends on backend details that have not yet been decided in the schema doc.

---

## CONFLICTS

The following conflicts were found between existing conventions and the brand decisions doc. No winner was chosen — flag for resolution.

| # | Convention in `ux-conventions.md` (previous) | Value in `brand-decisions.md` | Notes |
|---|---|---|---|
| 1 | Task prompt states shadow color `#1A0A3C` | Brand doc §6 shadows use `shadowColor: '#0F172A'` | The task description and the source doc disagree. The value written above (`#0F172A`) is taken directly from the brand doc (source of truth). |
| 2 | Task prompt says "2.5-second auto-dismiss" for toasts | Brand doc §7 specifies Success/Info: 4s, Warning: 5s, Error: 6s, Action: 7s | The task description and the source doc disagree. The values written above are taken directly from the brand doc. |
| 3 | Task prompt states shimmer tokens `shimmerBase #E8E0F7` and `shimmerHighlight #F5F0FF` | Brand doc §11: base `#E8E5F2`, highlight `#F4F2FA` | The task description and the source doc disagree. Values above are from the brand doc. |
| 4 | Task prompt says error token is `error` / `#E53935` | Brand doc §8 specifies `error-700` `#9F1239` for error text | The task description and the source doc disagree. The value above (`error-700` / `#9F1239`) is from the brand doc. |
| 5 | Previous Section 2 had 4 border radius tokens (`radiusSm`, `radiusMd`, `radiusLg`, `radiusFull`) | Brand doc §6 specifies 6 tokens (`radiusXs`, `radiusSm`, `radiusMd`, `radiusLg`, `radiusXl`, `radiusFull`) | Net additions: `radiusXs` (4) and `radiusXl` (24). Any existing code referencing the old 4-token set must be updated. |
| 6 | Previous spacing scale had 7 tokens (`xxs` through `xxl`) | Brand doc §6 specifies 9 tokens (`xxxs` through `xxxl`) | Net additions: `xxxs` (2) and `xxxl` (64). |
| 7 | Previous touch target rule was a single minimum (44×44, HIG) | Brand doc §6 specifies 4 named age-banded tiers | Existing components sized at 44pt meet `touchMin` but may not meet the new `touchAdult` default of 48pt. |