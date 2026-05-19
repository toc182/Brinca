# UX fixes — what we tried, did it work?

Running log of UX fix attempts so we don't re-litigate the same decisions.

---

## Attempt 1 — tab bar covers content (2026-05-11)

**Bug:** On the 4 tab screens (Home, Activity, Stats, Profile) and the Session detail sub-screen, scrolling to the very bottom leaves the last row hidden behind the floating iOS tab bar.

**What we're doing:** Add `contentInsetAdjustmentBehavior="automatic"` to every scroll view (`Animated.ScrollView`, `Animated.FlatList`, `ScrollView`) inside the `(tabs)` group.

**Why this and not a wrapper:**
- Expo SDK 55+ `unstable-native-tabs` is supposed to auto-enable content-inset adjustment on the first `ScrollView` inside a native tabs screen.
- It evidently doesn't pick up Reanimated's `Animated.ScrollView`/`Animated.FlatList`, which is what the tab screens use.
- `react-native-safe-area-context` SafeAreaView (used by our `<Screen>`) only adds hardware insets (home indicator ~34pt), not the tab bar (~50pt). So wrapping with `<Screen edges={['bottom']}>` would not have fixed this anyway. The previous handoff plan was wrong.
- Setting the prop explicitly is the iOS-idiomatic answer per RN docs.

**Files touched:**
- `src/features/home-dashboard/screens/HomeScreen.tsx` (3 `Animated.ScrollView`)
- `src/features/profile/screens/ProfileScreen.tsx` (3 `Animated.ScrollView`)
- `src/features/stats/screens/StatsScreen.tsx` (2 `Animated.ScrollView` + 1 `Animated.FlatList`)
- `src/features/stats/screens/SessionDetailScreen.tsx` (1 `ScrollView`)

`ActivityScreen` has no screen-level scroll view (content lives inside a BottomSheet), so nothing to do there.

Screens inside `(settings)` and `(modals)` are presented modally above the tab bar — the tab bar isn't visible there, so they don't need the prop.

**How to verify on the device:**
- Reload, open Home → scroll the list to the very bottom → last row should sit fully above the tab bar (not behind it).
- Same for Stats (FlatList of sessions), Profile (long content), Session detail.

**Result:** ✅ Works. User confirmed on device 2026-05-11 — last row visible above tab bar on Home, Stats, Profile, Session detail.

---

## Attempt 2 — keyboard hides form fields (2026-05-11, in progress)

**Bug:** On some form screens, tapping a text field near the bottom is hidden by the keyboard.

**Plan:** standardize every form on `react-native-keyboard-controller`:
- Scrolling forms → `KeyboardAwareScrollView` + `bottomOffset={16}` + `keyboardDismissMode="interactive"` + `keyboardShouldPersistTaps="handled"`.
- Non-scrolling forms / `formSheet` modals → `KeyboardAvoidingView` from the library.
- Bottom-sheet forms → `BottomSheetScrollView` from `@gorhom/bottom-sheet` + `<Input inBottomSheet />`.
- Every screen with a text input mounts `<KeyboardToolbar />` once for the iOS-stock Prev / Next / Done bar.

Plan file: `~/.claude/plans/ive-enabled-plan-mode-steady-wind.md`.

### Batch 1 — converted plain ScrollView → KeyboardAwareScrollView + toolbar

- `src/features/activity-builder/screens/CreateActivityScreen.tsx`
- `src/features/activity-builder/screens/CreateDrillScreen.tsx`
- `src/features/activity-builder/screens/DrillEditScreen.tsx` (outer form only — inner element-editor BottomSheet is Batch 2)
- `src/features/profile/screens/EditProfileScreen.tsx`

Typecheck: clean.

**Result:** ⚠️ Toolbar appears with Prev / Next / Done, but with a visible gap between the toolbar and the keyboard — not Apple-flush.

**Cause:** `<KeyboardToolbar />` was placed inside `<Screen edges={['bottom']}>`, which adds ~34pt bottom padding for the home indicator. The toolbar inherits that padding, so it can't sit flush against the keyboard. Library's own example places `<KeyboardToolbar />` at the screen root, not inside a SafeAreaView.

**Fix:** moved `<KeyboardToolbar />` outside `<Screen>` on all 4 Batch 1 screens. Pattern is now:

```tsx
<>
  <Screen edges={['bottom']}>
    <KeyboardAwareScrollView ...>{/* form */}</KeyboardAwareScrollView>
  </Screen>
  <KeyboardToolbar />
</>
```

Typecheck: clean.

**Re-test:** All 4 Batch 1 screens verified on device ✅ — Edit Profile, Create Activity, Create Drill, Drill Edit. Field visible above toolbar on each. Glass tint reads correctly.

**Two extra fixes applied during this iteration:**
- `bottomOffset` raised from 62 → **88** (was hiding bottom of input behind the iOS 26 floating toolbar — input is 48pt tall and on iOS 26 the toolbar top sits 53pt above keyboard, so 88 = 53 + 24 caret-to-input-bottom + 11pt breathing room).
- Toolbar tint changed from `systemChromeMaterial` (Apple's most opaque material — what nav bars use, intentionally solid-looking) to **`systemUltraThinMaterial`** (most translucent — actually reads as glass).
- Shared `AppKeyboardToolbar` component created at `src/shared/components/AppKeyboardToolbar.tsx` so every form uses the same glass + tint config.

### How to verify Batch 1 on device

For each of the 4 screens above:
1. Open the screen (Edit Profile: Profile tab → Edit; Create Activity: Settings → Activities → New; Create Drill: an activity → Add drill; Drill Edit: an activity → tap a drill).
2. Tap any text field. The field must be visible above the keyboard.
3. The keyboard toolbar should show `Previous` / `Next` / `Done`. Prev/Next move focus between fields; Done dismisses the keyboard.
4. With keyboard up, drag down inside the scroll view — keyboard should dismiss smoothly (interactive dismiss).

### Out of scope for Batch 1 (handled in later batches)

- Batch 2: bottom-sheet forms — Measurements, External Activities, plus the inner element editor inside Drill Edit.
- Batch 3: toolbar-only pass on the ~13 screens that already handle the keyboard correctly.

### Batch 2 — structural bug found in shared BottomSheet

After Batch 1 was confirmed working on device, testing the bottom-sheet forms turned up a real bug in the shared `BottomSheet` wrapper. It was always wrapping its children in `BottomSheetView`. The library's source treats `BottomSheetView` and `BottomSheetScrollView` as **alternatives**, not nestable: `BottomSheetView` writes `type: SCROLLABLE_TYPE.VIEW` into the sheet's internal state on mount. Any `BottomSheetScrollView` nested inside is then ignored for scroll and keyboard logic. That's why External Activities couldn't scroll at all even after we wrapped its form in `BottomSheetScrollView`, and the bottom fields stayed hidden behind the keyboard.

**Fix applied:** the shared `BottomSheet` no longer auto-wraps children. Each caller picks the right container:
- `BottomSheetView` for short static panels (Measurements, ActivityScreen picker).
- `BottomSheetScrollView` for forms that need to scroll (External Activities, Drill Edit's two inner sheets).
- `BottomSheetFlatList` if/when needed for long lists.

This matches `@gorhom/bottom-sheet`'s own intended API. The library's built-in keyboard handling (sheet rises to fit, focused field stays visible) now works because the sheet correctly registers a scrollable container, not a static one.

### Batch 2 — bottom-sheet forms

**Files changed:**
- `src/shared/components/BottomSheet.tsx` — added `InBottomSheetContext.Provider value={true}` wrapping children. Any `<Input>` rendered anywhere inside the shared `BottomSheet` now auto-detects and swaps to `BottomSheetTextInput`. Cleaner than tagging every Input manually.
- `src/shared/components/Input.tsx` — reads `InBottomSheetContext`. The `inBottomSheet` prop is still accepted as an explicit override but no longer required.
- `src/features/profile/screens/MeasurementsScreen.tsx` — added `<AppKeyboardToolbar />` outside `<Screen>`.
- `src/features/profile/screens/ExternalActivitiesScreen.tsx` — added `inBottomSheet` to the 4 form Inputs (explicit, doesn't break anything), added `<AppKeyboardToolbar />` outside `<Screen>`.
- `src/features/activity-builder/screens/DrillEditScreen.tsx` — element-editor sheet's inner `ScrollView` → `BottomSheetScrollView` so scroll + pan-down-to-close cooperate properly. The 26 Inputs across the 11 element-config components are picked up automatically via context — no per-file edits needed.

Typecheck: clean.

**Result:** [pending device test]

### How to verify Batch 2 on device

1. **Measurements** — Profile tab → Profile screen → tap a measurement → Add entry. Tap the Value field. It should sit above the keyboard with the toolbar.
2. **External Activities** — Settings → Child → External Activities → Add. Tap each field. Same.
3. **Drill Edit element editor** — Settings → Activities → pick an activity → pick a drill → tap an element in the list (opens the element-editor sheet). Tap the Name field, then any config input below. All inputs should stay visible above the keyboard with the toolbar.

