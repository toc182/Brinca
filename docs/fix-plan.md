# Brinca — Fix Plan

**Generated:** 2026-04-21
**Source:** 8 compliance audits (`docs/audits/`)
**Context:** `docs/ux-conventions.md`, `docs/architecture/02-project-structure.md`

---

## Executive summary

**Total gaps:** ~293 (PARTIAL + MISSING items across all 8 audits)
**Deferred items:** 3 (Accounts Center open questions)

| Phase | Description | Gap count | Estimated effort |
|-------|-------------|-----------|-----------------|
| **Phase 0** | Cross-cutting shared components | 7 tasks | ~2–3 days |
| **Phase 1** | Core flow features (Onboarding, Activity Builder, Session Logging, Activity Selector) | ~150 gaps | ~3–4 weeks |
| **Phase 2** | Supporting features (Home Dashboard, Stats, Profile, Accounts Center) | ~143 gaps | ~3–4 weeks |

Effort distribution: ~5% Phase 0, ~50% Phase 1, ~45% Phase 2. Phase 0 is small in scope but high in leverage — every shared component unblocks work across 4–8 features.

---

## Phase 0: Cross-cutting shared components

These issues appear in 3+ features. Building them once in shared code avoids duplicating effort across feature fixes.

| # | Task | Description | Target file | Features that benefit | Complexity |
|---|------|-------------|-------------|----------------------|------------|
| 0-1 | **Skeleton/shimmer loading component** | Build (or complete) `SkeletonPlaceholder` with shimmer animation per UX conventions §5: placeholder shapes, shimmer sweep 15–20° at 1500ms, base `#E8E5F2`, highlight `#F4F2FA`, 200–300ms delay, 400ms minimum display, reduce-motion fallback. | `src/shared/components/SkeletonPlaceholder.tsx` | Onboarding, Activity Selector, Home Dashboard, Profile, Accounts Center, Activity Builder, Stats, Session Logging (8 features) | Medium |
| 0-2 | **Error state component** | Shared "Something went wrong. Please try again." screen-level error state with retry button. Icon + message + action button per UX conventions §4. Accepts `onRetry` callback. | `src/shared/components/ErrorState.tsx` | Home Dashboard, Profile, Accounts Center, Activity Builder, Stats, Activity Selector (6 features) | Small |
| 0-3 | **Offline banner component** | Persistent banner: "You're offline. Changes will sync when your connection is restored." Auto-shows/hides based on `NetInfo`. Position at top of screen. | `src/shared/components/OfflineBanner.tsx` + `src/shared/hooks/useNetworkStatus.ts` | Onboarding, Activity Selector, Home Dashboard, Profile, Accounts Center, Activity Builder, Stats (7 features) | Medium |
| 0-4 | **Bottom sheet component** | Proper bottom sheet with drag handle, swipe-down dismiss, scrim overlay using `scrim` token (`#0F0B1F` @ 40%). Replace `Modal` usage across the app. Use `@gorhom/bottom-sheet` or equivalent. | `src/shared/components/BottomSheet.tsx` | Activity Selector, Profile (measurements, external activities), Activity Builder (element picker, tier/bonus), Accounts Center (role change) (4 features) | Medium |
| 0-5 | **Swipe-to-delete gesture row** | Reusable swipe-left-to-reveal-delete row component. Triggers a destructive confirmation alert before executing delete. | `src/shared/components/SwipeToDeleteRow.tsx` | Profile (measurements, external activities), Activity Builder (drills, elements), Session Logging (laps, multi-number entries) (3 features) | Medium |
| 0-6 | **Parent avatar header component** | Circular parent photo (or initials fallback) in top right corner of every screen. Tap navigates to Settings. Per UX conventions §1 "Parent avatar". | `src/shared/components/ParentAvatar.tsx` | Home Dashboard, Profile, Stats, Activity Selector, Activity Builder, Accounts Center (6+ features — every screen) | Small |
| 0-7 | **Destructive confirmation alert standardization** | Audit and enforce usage of `useDestructiveAlert` hook across all destructive actions. Ensure all alert copy matches spec text exactly. The hook exists — this task is about consistent adoption. | `src/shared/hooks/useDestructiveAlert.ts` (review) | Activity Builder, Session Logging, Profile, Stats (4 features) | Small |

---

## Phase 1: Core flow features

Features required for the primary user journey: create account → build activity → log session → view results. Ordered by dependency.

---

### 1.1 Onboarding (audit compliance: ~48%)

The primary email/password flow is broken (no verification step) and several secondary requirements are missing.

#### CRITICAL

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 1 | Onboarding #1 | Build email verification screen after account creation (show "Resend email" + "Change email" + auto-advance on verification) | Large |
| 2 | Onboarding #2 | Add "Resend email" button with 30-second cooldown on verification screen | Small |
| 3 | Onboarding #3 | Implement verification polling/listener to auto-advance to Step 2 | Medium |
| 4 | Onboarding #4 | Add "Sign in with Apple" button to Step 1 (create-account screen, not Login) | Medium |
| 5 | Onboarding #5 | Add "Sign in with Google" button to Step 1 | Medium |
| 6 | Onboarding #6 | Wire social login to skip verification and advance directly to Step 2 | Medium |

#### MEDIUM

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 7 | Onboarding #7 | Add "or" divider between social login buttons and email form on Step 1 | Small |
| 8 | Onboarding #8 | Add app logo and name to Step 1 (remove "Step 1 of 3" — spec says logo, not step indicator) | Small |
| 9 | Onboarding #9 | Add "Already have an account? Sign in" link at bottom of Step 1 | Small |
| 10 | Onboarding #10 | Make Terms of Service and Privacy Policy tappable links that open in-app browser | Small |
| 11 | Onboarding #11 | Make child photo avatar tappable — wrap in Pressable, integrate expo-image-picker (camera or library) | Medium |
| 12 | Onboarding #12 | Add maxLength={50} to child name input on Step 2 | Small |
| 13 | Onboarding #13 | Add network connectivity check on Step 1 — disable button + show offline toast when offline | Small |
| 14 | Onboarding #14 | Implement mid-onboarding resume — persist progress so closing the app resumes at current step | Medium |
| 15 | Onboarding #18 | Show inline error message for invalid email format (not just button disable) | Small |
| 16 | Onboarding UX-loading | Add loading spinner/indicator during account creation, child creation, and activity creation (buttons disable via isPending but no visual feedback) | Small |

#### LOW

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 17 | Onboarding #15 | Handle social login for existing email — log in and skip onboarding | Small |
| 18 | Onboarding #16 | Build error screen for expired verification link with "Resend email" button | Small |
| 19 | Onboarding #17 | Add photo-too-large inline error on Step 2 | Small |
| 20 | Onboarding #42 | Add maxLength prop to activity name input on Step 3 (inline error exists but no hard limit) | Small |
| 21 | Onboarding #45 | Preserve Step 1 data when navigating back from Step 2 (persist state across navigation) | Small |
| 22 | Onboarding #46 | Preserve Step 2 data when navigating back from Step 3 | Small |

---

### 1.2 Activity Builder (audit compliance: ~25–30%)

Covers the basic CRUD skeleton but is substantially incomplete. Must work before sessions can use configured drills.

#### CRITICAL — Activity list & creation

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 23 | AB #1 | Render activity icon in list rows | Small |
| 24 | AB #2 | Show active/deactivated status in list rows | Small |
| 25 | AB #3 | Add dimming for deactivated activities + toggle to reactivate | Medium |
| 26 | AB #5 | Build icon picker (predefined icon set) on create activity screen | Medium |
| 27 | AB #6 | Build category selector (Sport, Therapy, Academic, Custom) on create activity screen | Small |
| 28 | AB #8 | After creation, navigate to activity detail screen (not router.back()) | Small |
| 29 | AB #54 | Wire create → push into activity detail (replace `router.back()`) | Small |

#### CRITICAL — Activity detail

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 30 | AB #10 | Show activity name in detail header, make tappable to edit | Medium |
| 31 | AB #11 | Show activity icon in detail header, make tappable to change | Small |
| 32 | AB #12 | Build session-level tier rewards section (repo exists, no UI) | Large |
| 33 | AB #13 | Build session-level bonus presets section (repo exists, no UI) | Large |
| 34 | AB #15 | Replace long-press with drag reorder for drills (use `reorderDrills` repo method) | Medium |
| 35 | AB #16 | Replace long-press delete with swipe-left gesture + native iOS alert confirmation | Medium |
| 36 | AB #17 | Add deactivate activity toggle | Medium |
| 37 | AB #18 | Add delete activity flow with confirmation alert | Medium |
| 38 | AB #59 | Wire delete activity → navigate back to activity list | Small |

#### CRITICAL — Drill editing

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 39 | AB #21 | Replace flat button list with grouped bottom sheet picker (4 categories) for "Add element" | Medium |
| 40 | AB #23 | Add swipe-left to remove element with confirmation alert | Medium |
| 41 | AB #24 | Add long-press drag reorder for elements | Medium |
| 42 | AB #25 | Build drill-level tier rewards section | Large |
| 43 | AB #26 | Build drill-level bonus presets section | Large |
| 44 | AB #27 | Build tier condition builder (element reference + operator >=/<=/= + AND logic) | Large |
| 45 | AB #28 | Add deactivate drill toggle | Medium |
| 46 | AB #29 | Add delete drill option with confirmation alert on drill edit screen | Small |
| 47 | AB #65 | Validate tier reward has at least one condition ("Add condition" required) | Small |
| 48 | AB #66 | Show warning when tier references a deactivated element | Small |

#### CRITICAL — Screen states

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 49 | AB #50 | Add skeleton/shimmer loading to all activity builder screens (use Phase 0 shared component) | Medium |
| 50 | AB #51 | Add error state with retry to all activity builder screens (use Phase 0 shared component) | Small |
| 51 | AB #52 | Add offline banner + "Changes saved offline" toast | Small |

#### CRITICAL — Navigation

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 52 | AB #57 | Wire "Add tier" / tap existing tier → bottom sheet | Medium |
| 53 | AB #58 | Wire "Add bonus preset" / tap existing → bottom sheet | Medium |

#### MEDIUM

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 54 | AB #7 | Change create button disabled threshold from name.length >= 2 to name.length >= 1 | Small |
| 55 | AB #9 | Change create activity navigation to modal (slide up) instead of stack push | Small |
| 56 | AB #14 | Show tracking type summary on drill rows (e.g. "Counter · Target: 50") | Medium |
| 57 | AB #19 | Change create drill navigation to modal (slide up) instead of stack push | Small |
| 58 | AB #22 | Make element configs tappable-to-open (not always visible inline) | Medium |
| 59 | AB #30 | Add explicit "Save" button for drill edit (replace save-on-blur pattern) | Medium |
| 60 | AB #32 | Add target number of laps field to Lap timer config | Small |
| 61 | AB #33 | Add target items completed field to Checklist config | Small |
| 62 | AB #35 | Add target option field to Single select config | Small |
| 63 | AB #36 | Add target number selected field to Multi-select config | Small |
| 64 | AB #38 | Add target value field to Rating scale config | Small |
| 65 | AB #44 | Add target values per side to Split counter config | Small |
| 66 | AB #45 | Add target reps field to Multistep counter config | Small |
| 67 | AB #53 | Add empty state for drill edit screen when no elements exist | Small |
| 68 | AB #55 | Change "Add element" on DrillEditScreen to bottom sheet (not inline buttons) | Medium |
| 69 | AB #56 | Change element config on DrillEditScreen to bottom sheet (not inline rendering) | Medium |
| 70 | AB #60 | Add delete drill from drill edit screen (currently only on activity detail) | Small |
| 71 | AB #61 | Add `appendToQueue` call to `updateActivity` and `deleteActivity` in repository | Small |
| 72 | AB #62 | Add `appendToQueue` call to `updateDrill`, `deleteDrill`, `reorderDrills` in repository | Small |
| 73 | AB #63 | Add `appendToQueue` call to `updateElement`, `deleteElement` in repository | Small |
| 74 | AB #64 | Add `appendToQueue` calls to all operations in `bonus-preset.repository.ts` and `tier-reward.repository.ts` | Small |

#### LOW

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 75 | AB #4 | Verify empty state text matches spec exactly (requires checking i18n file) | Small |
| 76 | AB #20 | Add max 50 character validation to DrillEditScreen drill name (exists on CreateDrillScreen only) | Small |
| 77 | AB #31 | Make Stopwatch label configurable in config component | Small |
| 78 | AB #34 | Add reorder to checklist items in config | Small |
| 79 | AB #37 | Add target answer field to Yes/No config | Small |
| 80 | AB #39 | Make Rating scale min value configurable (currently hardcoded to 1) | Small |
| 81 | AB #40 | Add target face field to Emoji face scale config | Small |
| 82 | AB #41 | Add target entries field to Multi-number input config | Small |
| 83 | AB #67 | Add confirmation alert when removing element on CreateDrillScreen | Small |

---

### 1.3 Session Logging (audit compliance: ~55%)

Solid structural foundation with all 18 element renderers, but critical gaps in auto-save, voice note, and session summary.

#### CRITICAL — Core session flow

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 84 | SL #1 | Implement element auto-save — persist element values to SQLite after each interaction (not just on "Finish drill") | Large |
| 85 | SL #11 | Auto-start session timer when session begins (call `useSessionTimer().start()` and write initial `startTime` to MMKV) | Small |
| 86 | SL #8 | Implement 2-hour inactivity auto-pause for session timer | Medium |
| 87 | SL #9 | Show banner on return after inactivity: "Your session was paused due to inactivity. Resume?" | Small |
| 88 | SL #10 | Drills with no tracking elements: show "Mark complete" button on session screen instead of navigating to drill screen | Medium |

#### CRITICAL — Drill screen

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 89 | SL #2 | Add notes field (optional free text, no char limit) to DrillScreen | Small |
| 90 | SL #3 | Add photo attachment to DrillScreen (camera or library via expo-image-picker) | Medium |

#### CRITICAL — Session-level

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 91 | SL #4 | Add photo attachment to SessionNotes component | Medium |

#### CRITICAL — Session summary

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 92 | SL #5 | Show drills logged with completion status on summary screen | Medium |
| 93 | SL #6 | Add "Add bonus" button with preset picker and reason field on summary screen | Large |
| 94 | SL #7 | Add level progress display on summary screen | Medium |

#### CRITICAL — Voice note (entire component is a stub)

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 95 | SL #12 | Implement functional voice recording using expo-audio | Large |
| 96 | SL #13 | Add auto-stop at 3:00 with toast | Small |
| 97 | SL #14 | Add microphone permission request on first use | Small |
| 98 | SL #15 | Add permission-denied state with link to iOS Settings | Small |
| 99 | SL #16 | Add Re-record button with confirmation alert | Small |

#### MEDIUM — Counter/timer reset alerts

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 100 | SL #17 | Add confirmation alert before deleting voice note recording | Small |
| 101 | SL #18 | Add animated waveform during voice recording | Medium |
| 102 | SL #19 | Implement voice note local storage + upload to Supabase Storage on WiFi | Medium |
| 103 | SL #20 | Fix SingleSelect — allow deselecting by tapping the selected option | Small |
| 104 | SL #21 | Add Reset button with alert "Reset counter to zero?" to CounterElement | Small |
| 105 | SL #22 | Add Reset button with alert "Reset counter to zero?" to CombinedCounterElement | Small |
| 106 | SL #23 | Add independent Reset per side with alert to SplitCounterElement | Small |
| 107 | SL #24 | Change MultistepCounter interaction: tap chip to mark done (not "Next Step" button) | Medium |
| 108 | SL #25 | Add long-press on rep counter to clear current in-progress rep (not undo button) | Small |
| 109 | SL #26 | Fix MultistepCounter Reset: should reset reps + chips, add confirmation alert | Small |
| 110 | SL #27 | Play default alert sound when Countdown timer reaches 0 | Small |
| 111 | SL #28 | Add tap-to-silence when countdown alert sound plays | Small |
| 112 | SL #29 | Add swipe-to-delete on Lap timer rows | Medium |
| 113 | SL #30 | Add confirmation alert to Lap timer reset: "Reset timer and delete all laps?" | Small |
| 114 | SL #31 | Add vibration + sound at each Interval timer phase transition | Small |
| 115 | SL #32 | Add animated banner showing new phase name at Interval timer transitions | Small |
| 116 | SL #33 | Add confirmation alert to Interval timer reset: "Reset interval timer?" | Small |
| 117 | SL #34 | Replace "x" delete button with swipe-to-delete on Multi-number input entries | Medium |
| 118 | SL #35 | Show active child name + activity name as context on DrillScreen | Small |
| 119 | SL #36 | Fix reopening completed drill — update existing `drill_results` row instead of creating duplicate | Medium |
| 120 | SL #37 | Persist element-level timer startTimes in MMKV (not useRef) so they survive app kill | Medium |
| 121 | SL #38 | Add child-switching blocked mid-session alert | Small |

#### LOW

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 122 | SL #39 | Fix session summary presentation: use card push instead of fullScreenModal | Small |
| 123 | SL #40 | Add skeleton/shimmer loading while drill list loads | Small |
| 124 | SL #41 | Add green check corner badge on elements when target is met | Small |
| 125 | SL #42 | Implement periodic auto-save for FreeTextNote (not just on keystroke to state) | Small |
| 126 | SL #43 | Make Emoji face scale faces configurable from builder (not hardcoded sets) | Medium |
| 127 | SL #44 | Fix Yes/No selected color to use accent color per spec (not success/error) | Small |
| 128 | SL #45 | Play completion sound on Interval timer final rest phase | Small |
| 129 | SL #46 | Verify MiniPlayerBar placement in tab layout (renders across all tabs) | Small |
| 130 | SL #47 | Verify session notes save timing (spec says on "Done" in summary, not on "Finish Session") | Small |

---

### 1.4 Activity Selector (audit compliance: ~30%)

The core interaction model is wrong — needs a bottom sheet, not a Modal.

#### CRITICAL

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 131 | AS #1 | Replace `Modal` with proper bottom sheet (use Phase 0 shared component) | Medium |
| 132 | AS #2 | Auto-open bottom sheet immediately when Activity tab is tapped (no intermediate screen) | Medium |
| 133 | AS #8 | Fix empty state: text must match spec + add "Go to Settings" CTA button | Small |
| 134 | AS #10 | Build mini player bar component above tab bar for minimized sessions | Large |
| 135 | AS #11 | Mini player shows activity name + "— in progress" and "Resume" button | Small |
| 136 | AS #12 | Mini player persists across all tabs (render in tab layout) | Medium |
| 137 | AS #13 | Tapping mini player navigates to full session screen | Small |
| 138 | AS #14 | Mini player disappears when session is finished or abandoned | Small |
| 139 | AS #18 | Block child switching during active session — show native iOS alert | Small |
| 140 | AS #20 | Implement session persistence across app restarts (mini player reappears on next launch) | Large |
| 141 | AS #22 | Wire "Go to Settings" button in empty state to Settings screen | Small |

#### MEDIUM

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 142 | AS #3 | Add drag handle at top of bottom sheet | Small |
| 143 | AS #6 | Enable swipe-down dismiss on bottom sheet (not just overlay tap) | Small |
| 144 | AS #15 | Change Activity tab icon color when session is in progress | Small |
| 145 | AS #16 | When session is active, tapping Activity tab navigates directly to full session screen (not inline resume UI) | Medium |
| 146 | AS #19 | Add skeleton/shimmer loading while activity list loads | Small |
| 147 | AS #21 | Add offline handling — session starts normally offline (offline-first) | Medium |
| 148 | AS #26 | Resolve cross-feature imports (imports from session-logging and activity-builder) | Medium |

#### LOW

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 149 | AS #4 | Fix heading text from "Choose an activity" to "Select an activity" | Small |
| 150 | AS #23 | Wire session finished → navigate to Home screen | Small |
| 151 | AS #24 | Replace hardcoded scrim `rgba(0,0,0,0.4)` with `scrim` token | Small |

---

## Phase 2: Supporting features

Features that enhance but aren't required for the primary flow. Still important for a shippable product.

---

### 2.1 Home Dashboard (audit compliance: ~25–30%)

Data fetching and layout structure are in place, but nearly all interactivity is missing.

#### CRITICAL

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 152 | HD #1 | Display child's circular photo in header | Small |
| 153 | HD #2 | Show initials placeholder when no photo | Small |
| 154 | HD #3 | Make child header tappable — navigate to Profile tab | Small |
| 155 | HD #6 | Make reward progress section tappable — navigate to rewards screen | Small |
| 156 | HD #12 | Make recent session rows tappable — navigate to session detail | Small |
| 157 | HD #13 | Add "See all sessions" link — navigate to Stats tab | Small |
| 158 | HD #16 | Add "See all" link for accolades — navigate to full accolades screen | Small |
| 159 | HD #18 | Replace "Loading..." text with skeleton/shimmer loading | Medium |
| 160 | HD #19 | Add offline banner at top when no connection | Small |
| 161 | HD #20 | Auto-hide offline banner when connection restored | Small |
| 162 | HD #21 | Add error state with "Something went wrong" + retry button | Small |
| 163 | HD #26 | Fix cross-feature import violation in `useRedeemRewardMutation` (imports from session-logging) | Medium |

#### MEDIUM

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 164 | HD #4 | Implement visual badge evolution at every 10th level milestone | Medium |
| 165 | HD #5 | Fix level calculation to include currency earned (not just session count) | Small |
| 166 | HD #8 | Wire "Add reward" button — pass `onAddReward` prop and navigate | Small |
| 167 | HD #11 | Add completion status (complete/incomplete) to recent session rows | Small |
| 168 | HD #15 | Add accolade icons/badges (currently text only) | Medium |
| 169 | HD #22 | Wire first-time state CTAs across all sections | Medium |
| 170 | HD #23 | Add "No drills configured" empty state with "Add drill" button | Small |
| 171 | HD #25 | Add parent avatar (top right) — use Phase 0 shared component | Small |

#### LOW

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 172 | HD #7 | Fix reward empty state text to match spec exactly | Small |
| 173 | HD #9 | Fix reward progress format: "32 of 50 Coins — New baseball glove" | Small |
| 174 | HD #10 | Move streak indicator near active child header (currently in ConsistencyMetrics row) | Small |
| 175 | HD #14 | Fix recent sessions empty state text to match spec exactly | Small |
| 176 | HD #17 | Distinguish "no sessions completed yet" from "no accolades earned" in accolades section | Small |
| 177 | HD #24 | Add scroll-to-top on Home tab re-tap | Small |
| 178 | HD #33 | Fix content order: swap currency and reward sections to match spec order | Small |

---

### 2.2 Stats (audit compliance: ~15–20%)

Very early scaffold stage. Core differentiating features (time filter, charts, activity filter) are entirely absent.

#### CRITICAL — Time filter & period system

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 179 | Stats #1 | Build segmented control: Week / Month / Year / All Time | Medium |
| 180 | Stats #2 | Default view to Week showing current week | Small |
| 181 | Stats #3 | Build period selector dropdown to change period within selected filter | Medium |
| 182 | Stats #4 | Compute and show previous-period comparison label | Medium |
| 183 | Stats #43 | Update `getStatsSummary` repository to accept date range parameters | Medium |
| 184 | Stats #44 | Update `getSessionList` repository to accept date and activity filter parameters | Medium |

#### CRITICAL — Charts

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 185 | Stats #7 | Build cumulative line chart (top) using Victory Native XL | Large |
| 186 | Stats #8 | Build bar chart (bottom) using Victory Native XL | Large |
| 187 | Stats #9 | Style charts: current period in accent color, previous in gray | Small |
| 188 | Stats #10 | Wire chart updates when a different summary card is selected | Medium |
| 189 | Stats #11 | Make X-axis labels adapt to selected time filter | Small |

#### CRITICAL — Summary cards

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 190 | Stats #15 | Make summary cards tappable (Pressable), add selected state, wire to chart | Medium |
| 191 | Stats #16 | Add previous period value and comparison indicator (↑ ↓ =) to each card | Medium |

#### CRITICAL — Activity filter

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 192 | Stats #18 | Add activity filter button in header | Small |
| 193 | Stats #19 | Build activity filter modal with "All Activities" + checkboxes + "Done" | Medium |
| 194 | Stats #20 | Wire filter to update charts, cards, and session list | Medium |

#### CRITICAL — Screen states

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 195 | Stats #38 | Add skeleton/shimmer loading state | Small |
| 196 | Stats #39 | Add error state with retry button | Small |
| 197 | Stats #40 | Add offline banner + cached data display | Small |

#### MEDIUM

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 198 | Stats #5 | All Time view: hide period selector and comparison label | Small |
| 199 | Stats #6 | Switching time periods resets activity filter to "All Activities" | Small |
| 200 | Stats #12 | All Time chart: single cumulative line from first session | Small |
| 201 | Stats #13 | No data: chart shows flat line | Small |
| 202 | Stats #14 | Fix summary card labels to match spec exactly and use proper 2x2 grid layout | Small |
| 203 | Stats #22 | Add activity icon to session rows | Small |
| 204 | Stats #23 | Show key stat in session row format: "12 drills · Baseball" | Small |
| 205 | Stats #24 | Add completion indicator on session rows if session is incomplete | Small |
| 206 | Stats #26 | Show session count above list (e.g. "5 sessions") | Small |
| 207 | Stats #27 | Show "0 sessions" when none exist (not empty state message — spec says structure always visible) | Small |
| 208 | Stats #30 | Show drill recorded values on session detail screen | Medium |
| 209 | Stats #31 | Add drill-level photos on session detail screen | Medium |
| 210 | Stats #32 | Add session-level photos on session detail screen | Medium |
| 211 | Stats #36 | Add explicit invalidation on child switch for immediate data refresh | Small |
| 212 | Stats #41 | Add loading skeleton to session detail screen (currently returns null/blank) | Small |
| 213 | Stats #42 | Hide comparison indicators when only one period of data exists | Small |
| 214 | Stats #46 | Fix N+1 query: join activity name in `getSessionList` instead of per-row SELECT | Small |

#### LOW

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 215 | Stats #17 | Cards default to 0 — verify works for all time periods (not just all-time) | Small |
| 216 | Stats #25 | Replace `›` text character with Phosphor chevron icon in session rows | Small |
| 217 | Stats #33 | Fix delete session alert copy to match spec exactly | Small |
| 218 | Stats #37 | Verify "See all sessions" link from Home dashboard navigates to Stats (cross-feature) | Small |
| 219 | Stats #47 | Add parent avatar in Stats header | Small |

---

### 2.3 Profile (audit compliance: ~40–45%)

Core read-only profile exists but major sections are missing (Photos, Edit Profile).

#### CRITICAL

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 220 | Profile #1 | Build Photos section — grid of session photos | Large |
| 221 | Profile #2 | Build full-screen photo viewer on tap | Medium |
| 222 | Profile #3 | Add "See all" link when 6+ photos, build full gallery screen | Medium |
| 223 | Profile #4 | Add Photos empty state: "No photos yet. Photos taken during sessions will appear here." | Small |
| 224 | Profile #5 | Build Edit Profile form modal — all fields (photo, name, DOB, country, gender, grade, school calendar) | Large |
| 225 | Profile #6 | Build school calendar picker (Panamanian, US, Custom with start/end month) | Medium |
| 226 | Profile #7 | Wire Edit Profile save (disabled until change), cancel/swipe dismiss, toast on save, inline validation | Medium |
| 227 | Profile #8 | Add photo-too-large inline error in Edit Profile | Small |
| 228 | Profile #9 | Add offline save with "Changes saved offline" toast in Edit Profile | Small |
| 229 | Profile #10 | Replace "Loading..." with skeleton/shimmer loading | Small |
| 230 | Profile #11 | Add error state with retry button | Small |
| 231 | Profile #12 | Add offline banner | Small |
| 232 | Profile #13 | Block child switching during active session with native iOS alert | Small |
| 233 | Profile #14 | Add parent avatar in top right corner | Small |

#### MEDIUM

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 234 | Profile #15 | Add session count + last session date to app-tracked activities | Medium |
| 235 | Profile #16 | Include external activities in profile query | Medium |
| 236 | Profile #17 | Visually distinguish app-tracked and external activities in same list | Small |
| 237 | Profile #19 | Show "No activities yet." empty state when activities list is empty (not render null) | Small |
| 238 | Profile #20 | Add "Go to Accounts Center" button to child switcher bottom sheet | Small |
| 239 | Profile #22 | Add scroll-to-top on child switch | Small |
| 240 | Profile #24 | Make MeasurementsSummary tappable — navigate to measurements screen | Small |
| 241 | Profile #25 | If no measurements, tapping opens empty history with prompt | Small |
| 242 | Profile #26 | Replace inline form with bottom sheet for "Add entry" on measurements screen | Medium |
| 243 | Profile #27 | Replace text input for date with proper DateTimePicker on measurements screen | Small |
| 244 | Profile #29 | Add edit functionality — tap existing measurement entry opens pre-filled bottom sheet | Medium |
| 245 | Profile #30 | Replace delete button with swipe-left-to-delete on measurements | Medium |
| 246 | Profile #35 | Replace inline form with modal for "Add activity" on external activities screen | Medium |
| 247 | Profile #37 | Add edit functionality — tap existing external activity opens pre-filled modal | Medium |
| 248 | Profile #38 | Replace delete button with swipe-left-to-delete on external activities | Medium |
| 249 | Profile #43 | Verify tapping child header on Home dashboard navigates to Profile (cross-feature) | Small |

#### LOW

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 250 | Profile #18 | Remove extra "See all" link on activities section header (spec says list is read-only) | Small |
| 251 | Profile #21 | Add early return in child switcher when selecting already-active child | Small |
| 252 | Profile #23 | Wire "Add child" in child switcher to navigate to Settings | Small |
| 253 | Profile #28 | Show unit as separate read-only field in measurement form (not just in label) | Small |
| 254 | Profile #31 | Fix measurement delete alert text to match spec exactly | Small |
| 255 | Profile #32 | Add toast "Entry saved." after measurement add | Small |
| 256 | Profile #33 | Show inline error "Value must be a positive number." for negative measurement values | Small |
| 257 | Profile #34 | Fix measurement empty state text to match spec exactly | Small |
| 258 | Profile #36 | Add max 50 character validation to external activity name | Small |
| 259 | Profile #39 | Fix external activity delete alert text to match spec exactly | Small |
| 260 | Profile #40 | Add toast "Changes saved." on external activity add/edit | Small |
| 261 | Profile #41 | Fix external activities empty state text to match spec exactly | Small |
| 262 | Profile #42 | Show inline error "This field is required." when external activity name is empty | Small |
| 263 | Profile #44 | Verify child switch reloads Profile tab data (query depends on childId) | Small |
| 264 | Profile #45 | Change measurements from tabs to two visible sections on one screen per spec | Medium |
| 265 | Profile #59 | Remove LIMIT 5 from activities query — spec says "list of all activities" | Small |

---

### 2.4 Accounts Center (audit compliance: ~15–20%)

Very early scaffold stage. Only name/email display, measurement toggle, and basic delete-account flow exist.

#### CRITICAL — Profile section

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 266 | AC #1 | Add profile photo display + tap to change via system photo picker | Medium |
| 267 | AC #2 | Build edit display name modal (pre-filled, max 50 chars, Save disabled until changed, Cancel/swipe, toast) | Medium |
| 268 | AC #3 | Build edit email modal (requires current password, validation, verification email, toast) | Large |
| 269 | AC #4 | Build change password modal (current + new + confirm, real-time requirement checklist, inline errors, toast) | Large |
| 270 | AC #32 | Fetch profile data from Supabase auth (display name and email are currently hardcoded) | Medium |

#### CRITICAL — Family section

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 271 | AC #8 | Build family members list (photo/initials, name, role label) | Medium |
| 272 | AC #9 | Make family member rows tappable — navigate to detail screen (stack push) | Small |
| 273 | AC #10 | Make admin's own row non-tappable | Small |
| 274 | AC #11 | Build "Invite member" modal (email + role picker) | Large |
| 275 | AC #12 | Implement role system (Admin / Co-admin / Collaborator / Member) | Large |
| 276 | AC #13 | Enforce invite permissions: Admin can invite all roles; Co-admin can invite Collaborator/Member only | Medium |
| 277 | AC #14 | Send invite email, show toast "Invite sent to [email]." | Medium |
| 278 | AC #15 | Show inline error when inviting existing family member | Small |
| 279 | AC #16 | Show inline error when inviting invalid email | Small |
| 280 | AC #17 | Build family member detail screen (photo, name, email, role, "Change role", "Remove from family") | Large |
| 281 | AC #18 | Build "Change role" bottom sheet with available roles, applies immediately, toast "Role updated." | Medium |
| 282 | AC #19 | Enforce role change permissions: Admin can change any; Co-admin can change Collaborator/Member only | Small |
| 283 | AC #20 | Wire "Remove from family" — native iOS alert with specific message, toast "Member removed." | Small |
| 284 | AC #21 | Make Co-admin rows non-tappable for other Co-admins | Small |

#### CRITICAL — Account section & screen states

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 285 | AC #25 | Replace second native alert with text-input confirmation (type "DELETE") for account deletion | Medium |
| 286 | AC #27 | Add skeleton/shimmer loading state | Small |
| 287 | AC #28 | Add offline banner + block network-dependent actions with toast | Small |
| 288 | AC #29 | Add error state with retry button | Small |

#### MEDIUM

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 289 | AC #5 | Add initials placeholder when no profile photo is set | Small |
| 290 | AC #22 | Add "Sign in with Apple" row — visible but disabled with "Coming soon" label | Small |
| 291 | AC #23 | Add "Sign in with Google" row — visible but disabled with "Coming soon" label | Small |
| 292 | AC #24 | Fix delete account first alert: title "Delete your account?" + exact spec message text | Small |
| 293 | AC #26 | Wire server-side data deletion for account deletion (Edge Function) | Large |

#### LOW

| # | Audit ref | Task | Complexity |
|---|-----------|------|------------|
| 294 | AC #6 | Change section header from "Family Settings" to "Family" | Small |

---

## Deferred items

These are explicitly marked as open questions / deferred in the spec and should not be worked on now. Listed here so they don't get lost.

| Audit ref | Description | Reason |
|-----------|-------------|--------|
| AC #33 | Pending invites visible in family member list | Open question in spec — no decision made |
| AC #34 | Invite revocation capability | Open question in spec |
| AC #35 | Invite expiration policy | Open question in spec |

---

## Recommendation

**Start with Phase 0.** The 7 cross-cutting components take 2–3 days but unblock work across all 8 features. Without them, every feature fix will either skip screen states (and need rework later) or build its own one-off implementation (and diverge from UX conventions).

After Phase 0, start Phase 1 in this order: **Onboarding → Activity Builder → Session Logging → Activity Selector**. Onboarding must work before anything can be tested end-to-end. Activity Builder must work before Session Logging can use configured drills. Session Logging must work before Activity Selector's mini player bar makes sense. Within each feature, prioritize CRITICAL gaps first — they represent broken core flows and missing required behaviors. MEDIUM gaps improve quality but the feature is minimally testable without them. LOW gaps are polish.

Phase 2 features can be worked in parallel once Phase 1 is stable. Home Dashboard and Stats both depend on session data from Phase 1. Profile and Accounts Center are independent of each other and can be done in any order.
