# Changes Log — 2026-04-22 / 2026-04-23

Runtime debugging session after 293-gap compliance fix. All changes below diverge from or extend existing specs.

---

## Bug fixes (no spec impact)

- **dashboard.repository.ts**: `photo_url` → `avatar_url` (column name mismatch vs SQLite schema)
- **useNetworkStatus.ts**: Added fetch-based verification — NetInfo returns false negatives on iOS 26 beta, so we verify with a HEAD request to `clients3.google.com/generate_204` before showing offline
- **OfflineBanner.tsx**: Changed from always-rendered animated banner to conditional render (`return null` when online)
- **active-session.store.ts**: Self-heal on rehydration — if status is not idle but sessionId is null, reset all fields. Also clears orphaned timer MMKV keys. Fixed race condition: mutate state directly in `onRehydrateStorage` instead of calling actions
- **active-child.store.ts**: Added rehydration validation — if any of childId/childName/familyId is missing, clear all three
- **All 4 persisted stores**: Added `version: 1` with pass-through `migrate` for future schema safety
- **useDeleteAccountMutation.ts**: Now clears onboarding store on account deletion (was missing, caused stale verification email on re-signup)
- **SessionScreen.tsx**: Added manual `useSafeAreaInsets` top padding for fullScreenModal context

## Navigation fixes

- **Root layout `_layout.tsx`**: `(modals)` group now has `presentation: 'fullScreenModal'` at the root Stack level
- **Modals layout `(modals)/_layout.tsx`**: Inner Stack changed from `presentation: 'fullScreenModal'` (default) to no presentation (card). This fixes sibling navigation within the modals group (drill screen, session summary) which was silently failing
- **RewardProgress.tsx**: Removed `router.push('/rewards')` — route doesn't exist yet. Component is now non-tappable
- **AccoladeRow.tsx**: "See all" link only renders when `onSeeAll` prop is provided — removed fallback to phantom `/accolades` route
- **HomeScreen.tsx**: Removed `router.push('/rewards')` from `onAddReward`

## UX/Layout changes (SPEC DIVERGENCE)

### Removed native navigation headers from all tabs
- **Tabs layout `(tabs)/_layout.tsx`**: Set `headerShown: false` globally for all tabs
- Removed `SettingsButton` (gear icon) from home tab header — spec says Settings entry point is the ParentAvatar, not a gear icon
- Removed `GearSix` import

### New shared TabHeader component
- **Created `src/shared/components/TabHeader.tsx`**
- Used on all 4 tabs: Home, Activity, Stats, Profile
- Layout: child avatar (small) + child name on left, ParentAvatar on right
- Handles safe area insets internally (`useSafeAreaInsets`)
- Accepts optional `trailing` prop for extra controls (e.g., Stats filter button)
- Replaces: the old per-screen custom headers, the native nav bar titles, and the inline ParentAvatar placement

### Home screen header simplified
- Removed the large inline child header (avatar + name + streak + ParentAvatar) — replaced by TabHeader
- Removed streak counter from the header area
- Streak data is still calculated and available; just not displayed in the header

### Stats screen header
- Removed `navigation.setOptions` for header right buttons
- Filter button and ParentAvatar now rendered via TabHeader's `trailing` prop
- Removed the "Stats" screen title text (TabHeader shows child name instead)

### Profile screen header
- Removed custom `headerRow` with standalone ParentAvatar
- Now uses TabHeader like all other tabs
- ChildHeader component (large avatar + name) still renders in scroll content below

### NativeTabs + native large title headers (REPLACES all custom header work above)
- **Replaced JS `Tabs` with `NativeTabs`** from `expo-router/unstable-native-tabs`
- Uses native `UITabBarController` — gets Liquid Glass automatically on iOS 26
- SF Symbols for tab icons: `house.fill`, `bolt.fill`, `chart.bar.fill`, `person.fill`
- `minimizeBehavior="onScrollDown"` — tab bar shrinks on scroll (iOS 26)
- **MiniPlayerBar** moved into `NativeTabs.BottomAccessory` — integrates with native tab bar instead of floating overlay. Removed absolute positioning.
- **Native large title headers** via `headerLargeTitle: true` on all 4 tab screens — native collapsing animation, blur, and edge blending handled by iOS
- **ParentAvatar** in `headerRight` on all tab screens via `navigation.setOptions`
- **Stats filter button** in `headerRight` alongside ParentAvatar via `navigation.setOptions`
- **`contentInsetAdjustmentBehavior="automatic"`** on all ScrollViews/FlatLists — required for native large title collapse
- **Created `app/(tabs)/stats/_layout.tsx`** — Stack layout for stats tab to support `stats/[sessionId]` sub-route
- **Deleted `src/shared/components/TabHeader.tsx`** — custom animated header no longer needed
- Removed all reanimated scroll tracking (`useSharedValue`, `useAnimatedScrollHandler`) from all 4 tab screens
- `expo-blur` installed but no longer used by custom header (native headers handle blur natively)

---

## Spec sections that need updating

- `docs/ux-conventions.md` §2 (navigation): Tab bar is now NativeTabs with Liquid Glass. Headers are native with large titles. No gear icon — ParentAvatar is the Settings entry point.
- `docs/ux-conventions.md` §3 (ParentAvatar): Now appears in native `headerRight` on all tabs
- `docs/feature-specs/home-dashboard.md` §1 (active child header): Removed — native large title "Home" replaces inline child header. No streak in header.
- `docs/feature-specs/stats.md`: Header is native large title "Stats" with filter button + ParentAvatar in headerRight
- `docs/feature-specs/profile.md`: Header is native large title "Profile" with ParentAvatar in headerRight
- `docs/architecture/04-offline-sync.md`: OfflineBanner behavior changed (conditional render, fetch verification)
- `docs/ux-conventions.md` (new): MiniPlayerBar is a NativeTabs.BottomAccessory, not a floating overlay
