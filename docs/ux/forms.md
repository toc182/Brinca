# Forms — patterns that actually work on iOS 26

Rules below are the result of a long, painful debugging session on 2026-05-12. They explain *what* to do and, where it matters, *why*. Don't deviate without re-reading the why.

---

## 1. Don't use a popup BottomSheet for an edit form

`@gorhom/bottom-sheet` is fine for **picking** something quick (e.g. tapping an activity in the activity picker, or short confirmations). It is NOT fine for forms with one or more text inputs, because:

- It does NOT auto-scroll the focused input into view. The library only repositions the *sheet*, never the contents inside the scroll view. Tapping a field below the keyboard leaves it hidden, with no built-in fix.
- Its `BottomSheetView` and `BottomSheetScrollView` are alternatives, not nestable. Nesting them silently breaks scrolling.
- iOS 26's floating keyboard toolbar adds ~53pt above the keyboard. Combined with the sheet's content area calculation, the bottom of the form gets eaten.

**For any screen with a `<TextInput>`: present the form as a full-screen modal Stack screen, not a popup sheet.** That's how Edit Profile works.

---

## 2. The modal-form recipe (use this every time)

Route registration in the relevant `(group)/_layout.tsx`:

```tsx
<Stack.Screen
  name="some/edit-route"
  options={{ title: 'Default Title', presentation: 'modal' }}
/>
```

The screen file:

```tsx
import { Stack } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { Screen } from '@/shared/components/Screen';

export function MyEditScreen() {
  // Dynamic title — overrides the layout-level default.
  const screenTitle = type === 'weight' ? 'Weight' : 'Height';

  return (
    <>
      <Stack.Screen options={{ title: screenTitle }} />
      <Screen edges={['bottom']}>
        <KeyboardAwareScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bottomOffset={88}
        >
          {/* form */}
        </KeyboardAwareScrollView>
      </Screen>
      <AppKeyboardToolbar />
    </>
  );
}
```

Key details that are NOT optional:

- `<AppKeyboardToolbar />` must be a **sibling of `<Screen>`, not inside it**. Inside `<Screen edges={['bottom']}>` the toolbar inherits the bottom safe-area padding (~34pt) and floats off the keyboard with a visible gap.
- `bottomOffset={88}` accounts for the iOS 26 floating toolbar (~53pt above the keyboard) plus the input's caret-to-bottom distance (~24pt) plus a small visual buffer. **Don't use the library's example value `62`** — that was for forms without a toolbar.
- `keyboardDismissMode="interactive"` enables the iOS-standard drag-to-dismiss for the keyboard.

---

## 3. iOS-grouped card layout

Brinca's forms use iOS's stock grouped-inset list pattern (same as Settings, Calendar event create, Reminders). One or more `<Card>`-like containers with full-width rows separated by hairline dividers.

```tsx
<View style={styles.card}>
  <TextInput
    style={styles.fullRowInput}
    value={name}
    onChangeText={setName}
    placeholder="Activity name"
    placeholderTextColor={colors.textPlaceholder}
    selectionColor={colors.primary500}
  />
  <View style={styles.divider} />
  <View style={styles.row}>
    <Text style={styles.rowLabel}>Unit</Text>
    <Text style={styles.rowValue}>kg</Text>
  </View>
</View>

// styles
card: {
  backgroundColor: colors.surface,
  borderRadius: radii.md,
  overflow: 'hidden',     // so dividers don't escape the rounded corners
},
fullRowInput: {
  ...typography.body,
  color: colors.textPrimary,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  minHeight: 48,
},
row: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: spacing.md,
  minHeight: 48,
},
divider: {
  height: StyleSheet.hairlineWidth,
  backgroundColor: colors.borderSubtle,
  marginLeft: spacing.md,  // iOS inset — aligns with row content
},
```

### Conventions

- **Primary text input rows** (a row that exists solely to capture one value): full-width `<TextInput>` with the field name as **placeholder only**. No left label. This matches iOS Calendar's "Title" / "Location" rows. The placeholder disappears once the user types.
- **Label + control rows** (label left, control right): use the `row` style with `Text` for the label and the control on the right. For static read-only values, use `rowValue` (secondary text color).
- **The screen's title** is the field name itself when the form is single-purpose (e.g. "Weight", "Height"), not a generic "Edit Measurement". Set this dynamically via `<Stack.Screen options={{ title }} />` from inside the screen.

---

## 4. Date pickers

Use `@react-native-community/datetimepicker` with `display` set to one of:

- **`compact`** (default for forms): small chip button → opens iOS's native popover. iOS manages dismiss. No custom Done button needed. Use this when there's only one date field.
- **`inline` with an accordion toggle** (iOS Calendar pattern): a chip button that, when tapped, expands the full inline calendar below it inside the same card. Tap the chip again to collapse. The chip changes color (default → accent) when expanded to signal collapsibility.
- **`spinner`**: LEGACY. Don't use on iOS 14+ — feels old and Android-y.

### Accordion-style date row

```tsx
const [dateExpanded, setDateExpanded] = useState(false);

<View style={styles.row}>
  <Text style={styles.rowLabel}>Date</Text>
  <Pressable
    onPress={() => {
      Keyboard.dismiss();             // dismiss any open keyboard
      setDateExpanded(v => !v);
    }}
  >
    <View style={[styles.dateChip, dateExpanded && styles.dateChipExpanded]}>
      <Text style={[styles.dateChipText, dateExpanded && styles.dateChipTextExpanded]}>
        {dateLabel}
      </Text>
    </View>
  </Pressable>
</View>
{dateExpanded ? (
  <DateTimePicker
    value={date}
    mode="date"
    display="inline"
    maximumDate={new Date()}
    onChange={(_, d) => d && setDate(d)}
  />
) : null}
```

**Do not** dismiss the picker inside `onChange`. iOS fires `onChange` for every wheel/calendar interaction. Auto-dismissing inside `onChange` is the bug that makes the picker close after every tap.

**Always call `Keyboard.dismiss()` when a non-text-input control (date chip, segmented control, etc.) is tapped while a keyboard is open** — React Native does not auto-dismiss on non-input taps.

---

## 5. Bottom sheets — when they ARE the right choice

A `BottomSheet` is the right tool for:

- **Picking** something from a list with no text input (e.g. `ActivityPickerSheet`).
- **Single-tap confirmations** with no editing.
- **Brief presentation of secondary content** that doesn't deserve a whole screen.

For any of those, in the shared `BottomSheet`:

- Wrap the children in `<BottomSheetView>` (static) or `<BottomSheetScrollView>` (scrollable) explicitly. The shared `BottomSheet` does NOT auto-wrap — you pick the right container.
- The shared component's defaults are `keyboardBehavior="interactive"` and `keyboardBlurBehavior="restore"`. Override `keyboardBlurBehavior` to `"none"` if `restore` causes problems on a specific sheet.
- Inputs anywhere inside a shared `BottomSheet` auto-detect they're inside a sheet via `InBottomSheetContext` and swap to `BottomSheetTextInput`. No need to set `inBottomSheet` on each `<Input>` manually.

---

## 6. Why this all matters (the punch line)

If a screen has a text input, the user expects:

1. The field stays visible above the keyboard.
2. The focused field auto-scrolls into view if the screen is taller than the visible area.
3. The keyboard dismisses when the user taps somewhere else.
4. A toolbar above the keyboard with Previous / Next / Done, sitting flush against the keyboard.

`KeyboardAwareScrollView` + `AppKeyboardToolbar` + the modal-form recipe above give you all four for free. `@gorhom/bottom-sheet` does not. Pick the right container for the job up front and stop fighting the library.
