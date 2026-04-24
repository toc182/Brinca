# UI Migration Spec — Native iOS Design (Post-Compliance Fix)

This document defines the design changes applied after the feature spec implementation, based on Apple Human Interface Guidelines (HIG) and iOS 26 Liquid Glass design system. Use this to update the existing feature specs and UX conventions.

---

## 1. Tab Bar

### HIG Rules (source: developer.apple.com/design/human-interface-guidelines/tab-bars)

- On iOS, the tab bar **floats above content** at the bottom of the screen using a **Liquid Glass background** that allows underlying content to remain visible.
- Include **clear, single-word labels** beneath icons.
- Use **SF Symbols** for icons — they scale and adapt automatically.
- The tab bar can **minimize on scroll** (iOS 26) when an accessory like a media player is present.
- Default to **5 or fewer tabs**.

### Implementation

- **Component**: `NativeTabs` from `expo-router/unstable-native-tabs` (replaces JS `Tabs` from `expo-router`)
- **Tab bar styling**: Fully native — Liquid Glass on iOS 26, standard translucent on older versions. Active tab tint set to `primary-500` (`#6D4AE0`).
- **Icons**: SF Symbols with default/selected variants:
  - Home: `house` / `house.fill`
  - Activity: `bolt` / `bolt.fill`
  - Stats: `chart.bar` / `chart.bar.fill`
  - Profile: `person` / `person.fill`
- **Labels**: Single word — Home, Activity, Stats, Profile
- **Minimize behavior**: `minimizeBehavior="onScrollDown"` — tab bar shrinks when user scrolls content down (iOS 26).

### What changed from previous specs

- Removed Phosphor icons — replaced with SF Symbols.
- Removed all custom tab bar styling except brand tint color.
- Removed `ActivityTabIcon` component with session-active color logic.

---

## 2. Screen Headers (CollapsibleHeader)

### HIG Reference

- Large titles help users maintain orientation, transitioning to standard size during scrolling.
- Content should scroll behind the header with a translucent/blur effect.
- Reference app: Gentle Streak — large title left-aligned, avatar right-aligned, content blurs behind header on scroll.

### Why not native `headerLargeTitle`

`react-native-screens` does not correctly position `headerRight` items inline with the large title on iOS 26 (issue #2990). Native Swift apps get this layout automatically, but React Native apps show the avatar in a separate compact bar above the large title. A patch exists for centering but not for positioning.

### Implementation

Custom `CollapsibleHeader` component (`src/shared/components/CollapsibleHeader.tsx`):

- **Title**: Child's name from `useActiveChildStore` (not "Home"/"Stats"/etc.)
- **Right content**: `ParentAvatar` on all tabs, filter button + ParentAvatar on Stats
- **Title animation**: Font size interpolates from 34pt (expanded) to 17pt (collapsed) over 40px of scroll, using Fredoka 600 SemiBold
- **Header height**: Animates from `insets.top + 52` (expanded) to `insets.top + 44 `(collapsed) + 30px fade zone
- **Blur background**: Native iOS module `GradientBlurView` (see §4)
- **Scroll tracking**: Each screen uses `useSharedValue` + `useAnimatedScrollHandler` from `react-native-reanimated`, passing `scrollY` to the header
- **Content padding**: `useCollapsibleHeaderHeight()` returns `insets.top + 52` for scroll content's `paddingTop`

### Per-tab configuration

| Tab | Title | Right content | Scroll component |
|-----|-------|---------------|------------------|
| Home | `childName ?? 'Home'` | ParentAvatar | Animated.ScrollView |
| Activity | `childName ?? 'Activity'` | ParentAvatar | Static (bottom sheet, no scroll) |
| Stats | `childName ?? 'Stats'` | Filter button + ParentAvatar | Animated.FlatList |
| Profile | `childName ?? 'Profile'` | ParentAvatar | Animated.ScrollView |

### What changed from previous specs

- Removed native `headerLargeTitle` — react-native-screens can't position headerRight inline with large title on iOS 26.
- Each tab `_layout.tsx` sets `headerShown: false` — headers are fully custom.
- Title shows child's name, not the tab name.
- Removed streak counter from header.
- Removed gear icon — ParentAvatar is the sole Settings entry point.

---

## 3. MiniPlayerBar (Session In-Progress Indicator)

### HIG Rules

- The tab bar supports **accessories** — persistent controls like a mini player that sit above the tab bar.
- Accessories integrate with the tab bar minimize behavior.

### Implementation

- **Component**: `NativeTabs.BottomAccessory` wraps `MiniPlayerBar`.
- **Positioning**: Uses `marginHorizontal` and `marginVertical` within the BottomAccessory slot. No absolute positioning.
- **State**: Stored in Zustand `useActiveSessionStore`.

### What changed from previous specs

- MiniPlayerBar was a floating overlay. Now it's a native BottomAccessory.
- Removed absolute positioning styles.

---

## 4. Gradient Blur (Native Module)

### Problem

`expo-blur`'s `BlurView` provides backdrop blur but has a hard edge at its boundary. Standard approaches to fade the edge (`MaskedView`, `LinearGradient` overlay, `ProgressiveBlurView`) either don't support Fabric, don't do backdrop blur, or produce visible artifacts.

### Solution

Custom Expo module `GradientBlurView` at `modules/GradientBlurView/`:

- **iOS implementation**: `UIVisualEffectView` with `UIBlurEffect(style: .systemUltraThinMaterialLight)`, masked by a `CAGradientLayer`
- **Gradient mask**: Black (opaque) at top → black at `fadeStart` → clear (transparent) at bottom. This makes the blur fully visible in the upper portion and fade smoothly to nothing at the bottom.
- **`fadeStart` prop** (0-1): Controls where the fade begins. Currently set to `0.55` — top 55% is fully blurred, bottom 45% fades to clear.
- **Android fallback**: Falls back to `expo-blur` BlurView (no gradient mask available).
- **Requires native rebuild** (EAS build) since it includes Swift code.

### Files

```
modules/GradientBlurView/
  ios/MyModule.swift           — Expo Module definition, exposes fadeStart prop
  ios/MyModuleView.swift       — UIVisualEffectView + CAGradientLayer mask
  ios/MyModule.podspec         — CocoaPods spec
  src/MyModuleView.tsx         — React Native wrapper
  src/MyModule.types.ts        — TypeScript types
  index.ts                     — Public exports
  expo-module.config.json      — Expo module config
```

---

## 5. Settings Entry Point

### UX Conventions §3 (existing, unchanged)

- **ParentAvatar** (parent's photo or initials, circular, small) appears in the header right of every tab screen.
- Tapping navigates to the Settings screen.
- No gear icon — ParentAvatar is the sole entry point.

### Implementation

- `ParentAvatar` passed as `rightContent` prop to `CollapsibleHeader`.
- Self-fetches parent display name and photo from Supabase auth metadata.
- Navigates to `/(settings)` on press.

---

## 6. File Structure Changes

### Tab directories

```
app/(tabs)/
  _layout.tsx              — NativeTabs with triggers + BottomAccessory
  home/
    _layout.tsx            — Stack with headerShown: false
    index.tsx              — HomeScreen route
  activity/
    _layout.tsx            — Stack with headerShown: false
    index.tsx              — ActivityScreen route
  stats/
    _layout.tsx            — Stack with headerShown: false (index), headerShown: true ([sessionId])
    index.tsx              — StatsScreen route
    [sessionId].tsx        — Session detail route (keeps native header for back navigation)
  profile/
    _layout.tsx            — Stack with headerShown: false
    index.tsx              — ProfileScreen route
```

### New files

- `src/shared/components/CollapsibleHeader.tsx` — shared header for all tabs
- `modules/GradientBlurView/` — native Expo module for gradient-masked blur

### Deleted files

- `src/shared/components/TabHeader.tsx` — replaced by CollapsibleHeader

---

## 7. Patches

### react-native-screens (4.23.0)

Patch at `patches/react-native-screens+4.23.0.patch`:
- Fixes iOS 26 header button centering in `RNSScreenStackHeaderSubview.mm`
- Centers subviews within the Liquid Glass backdrop on iOS 26+
- Source: github.com/software-mansion/react-native-screens/issues/2990
- Auto-applied via `postinstall` script in `package.json`

---

## 8. Dependencies Added

- `expo-blur` — backdrop blur (used as Android fallback in CollapsibleHeader)
- `expo-linear-gradient` — was already installed
- `@sbaiahmed1/react-native-blur` — ProgressiveBlurView (installed but not currently used in final implementation)
- `@react-native-masked-view/masked-view` — installed but not Fabric-compatible, unused
- `patch-package` — auto-applies patches on install
