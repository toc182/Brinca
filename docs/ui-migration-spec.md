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
- **Tab bar styling**: Fully native — Liquid Glass on iOS 26, standard translucent on older versions. No custom `tabBarStyle`, `backgroundColor`, or `tabBarActiveTintColor`.
- **Icons**: SF Symbols with default/selected variants:
  - Home: `house` / `house.fill`
  - Activity: `bolt` / `bolt.fill`
  - Stats: `chart.bar` / `chart.bar.fill`
  - Profile: `person` / `person.fill`
- **Labels**: Single word — Home, Activity, Stats, Profile
- **Minimize behavior**: `minimizeBehavior="onScrollDown"` — tab bar shrinks when user scrolls content down (iOS 26).
- **No custom colors or fonts** on the tab bar — the native system handles tint, selection, and Liquid Glass appearance.

### What changed from previous specs

- Removed Phosphor icons (`House`, `Lightning`, `ChartBar`, `User`) — replaced with SF Symbols.
- Removed custom `tabBarActiveTintColor`, `tabBarInactiveTintColor`, `tabBarStyle`.
- Removed `ActivityTabIcon` component with session-active color logic — native tab icons don't support runtime color changes. Session state should be conveyed through a badge or the BottomAccessory instead.

---

## 2. Navigation Bars (Headers)

### HIG Rules (source: developer.apple.com/design/human-interface-guidelines/toolbars)

- Use **large titles** to help users maintain orientation — these transition to standard size during scrolling.
- Navigation bars and toolbars are **transparent** with Liquid Glass buttons on iOS 26, giving more space to content.
- Prioritize only the most essential actions in the toolbar.

### Implementation

- Each tab is a **directory** with its own `_layout.tsx` containing a `Stack` navigator.
- Each Stack.Screen configures:
  - `title` — the tab's display name (e.g., "Home", "Stats")
  - `headerLargeTitle: true` — enables native collapsing large title
  - `headerRight: () => <ParentAvatar />` — settings entry point (per UX conventions §3)
  - `headerStyle: { backgroundColor: colors.background }` — matches app theme
- **ScrollView/FlatList must be the direct first child** of the screen component for large title collapse to work. If a wrapper View is needed, set `collapsable={false}` on it.
- **`contentInsetAdjustmentBehavior="automatic"`** on all ScrollViews/FlatLists — lets the system handle safe area and header insets.

### Per-tab header configuration

| Tab | Title | headerLargeTitle | headerRight | Notes |
|-----|-------|-----------------|-------------|-------|
| Home | "Home" | true | ParentAvatar | |
| Activity | "Activity" | true | ParentAvatar | |
| Stats | "Stats" | true | Filter button + ParentAvatar | Filter button updates dynamically via `navigation.setOptions` |
| Profile | "Profile" | true | ParentAvatar | |

### What changed from previous specs

- Removed custom `TabHeader` component (animated blur header with child avatar + name).
- Removed inline child header from Home screen (avatar + name + streak row) — native large title "Home" replaces it.
- Removed streak counter from header area. Streak data is still available but not displayed in the header.
- Removed gear icon (`GearSix`) from header — ParentAvatar is the sole Settings entry point.
- Removed all custom scroll tracking (`useSharedValue`, `useAnimatedScrollHandler`, `scrollY` shared values) from tab screens.
- Stats filter button moved from custom header to native `headerRight` via `navigation.setOptions`.

---

## 3. MiniPlayerBar (Session In-Progress Indicator)

### HIG Rules

- The tab bar supports **accessories** — persistent controls like a mini player that sit above the tab bar (reference: Music app MiniPlayer).
- Accessories integrate with the tab bar minimize behavior.

### Implementation

- **Component**: `NativeTabs.BottomAccessory` wraps `MiniPlayerBar`.
- **Positioning**: No longer `position: 'absolute'` with `bottom: 80`. Now uses `marginHorizontal` and `marginVertical` within the BottomAccessory slot.
- **State**: Must be stored outside the accessory component (already using Zustand `useActiveSessionStore`).

### What changed from previous specs

- MiniPlayerBar was a floating overlay inside a `<View>` wrapper around `<Tabs>`. Now it's a native BottomAccessory.
- Removed absolute positioning styles.

---

## 4. Materials and Visual Style

### HIG Rules (source: developer.apple.com/design/human-interface-guidelines/materials)

- **Liquid Glass** is a dynamic material that unifies the design language. It presents controls and navigation without obscuring underlying content.
- Two variants: `regular` (frosted blur) and `clear` (more transparent). Use `clear` only over visually rich backgrounds.
- Standard materials (ultra-thin, thin, regular, thick) are used in the **content layer** for visual distinction — NOT for navigation chrome.
- Do **not** manually implement blur, translucency, or glass effects on navigation bars or tab bars. The native components handle this.

### Implementation

- **No custom blur** (`expo-blur` BlurView) on navigation chrome. The native Stack header and NativeTabs handle Liquid Glass automatically on iOS 26.
- `expo-blur` is installed but reserved for future use in content-layer components if needed (e.g., overlay sheets).
- **No custom gradient fades** to simulate blur edges. The native header handles transitions seamlessly.
- **Background color**: `colors.background` (#FAF8FF) — the native header uses this as its base, with system materials applied on top.

### What changed from previous specs

- Removed custom `BlurView` header background.
- Removed `LinearGradient` fade-out attempts.
- Removed all `react-native-reanimated` interpolation for header height, font size, and avatar size.

---

## 5. Settings Entry Point

### UX Conventions §3 (existing, unchanged)

- **ParentAvatar** (parent's photo or initials, circular, small) appears in the top right corner of every screen.
- Tapping navigates to the Settings screen.
- No gear icon — ParentAvatar is the sole entry point.

### Implementation

- `ParentAvatar` rendered via `headerRight` in each tab's `_layout.tsx`.
- Self-fetches parent display name and photo from Supabase auth metadata.
- Navigates to `/(settings)` on press.

---

## 6. File Structure Changes

### Tab directories (new structure)

```
app/(tabs)/
  _layout.tsx          — NativeTabs with triggers + BottomAccessory
  home/
    _layout.tsx        — Stack with headerLargeTitle
    index.tsx          — HomeScreen route
  activity/
    _layout.tsx        — Stack with headerLargeTitle
    index.tsx          — ActivityScreen route
  stats/
    _layout.tsx        — Stack with headerLargeTitle + stats-specific headerRight
    index.tsx          — StatsScreen route
    [sessionId].tsx    — Session detail route
  profile/
    _layout.tsx        — Stack with headerLargeTitle
    index.tsx          — ProfileScreen route
```

### Deleted files

- `src/shared/components/TabHeader.tsx` — custom animated collapsible header, no longer needed.

---

## 7. ScrollView Requirements for Large Title

Per Expo Router docs, the native large title collapse requires:

1. `ScrollView` or `FlatList` is the **direct first child** of the screen component.
2. If a wrapper `View` is necessary, set `collapsable={false}` on it.
3. Add `contentInsetAdjustmentBehavior="automatic"` to the scrollable component.

Screens that currently wrap ScrollView in a container View (Home, Stats, Profile) need to ensure the ScrollView is the first rendered child, or the wrapper has `collapsable={false}`.
