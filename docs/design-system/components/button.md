# Button

Shared `<Button>` component for all CTAs and secondary actions. One component, six variants, two sizes, optional left icon.

**Implementation:** `src/shared/components/Button.tsx`.

---

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `title` | `string` | required | Button label. |
| `onPress` | `() => void` | required | Tap handler. |
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'destructive' \| 'text' \| 'ghost'` | `'primary'` | Visual treatment. See table below. |
| `size` | `'large' \| 'small'` | `'large'` | `large` = `touchAdult` (48), `small` = `touchMin` (44). |
| `disabled` | `boolean` | `false` | Shows `surfaceDisabled` bg + `textDisabled` text. |
| `pill` | `boolean` | `false` | Use `radiusFull` instead of `radiusMd` (kid CTA shape). |
| `iconLeft` | `React.ReactNode` | — | Renders an arbitrary node before the title with `xs` gap. Typically a Phosphor icon. |
| `style` | `ViewStyle` | — | Layout overrides (`flex`, `width`, etc.). Don't override colors here. |

---

## Variants

| Variant | Background | Border | Text |
|---|---|---|---|
| `primary` | `primary-500` | — | `textOnPrimary` (white) |
| `secondary` | `surface` | `borderDefault` (1pt) | `primary-500` |
| `outline` | `surface` | `primary-500` (1.5pt) | `primary-500` |
| `destructive` | `error-600` | — | `textOnPrimary` |
| `text` | transparent | — | `primary-500` |
| `ghost` | transparent | — | `textSecondary` |

> **`secondary` vs `outline`:** use `secondary` for low-emphasis actions where the button shouldn't compete (grey border). Use `outline` when the button is one of two parallel actions and needs to read as a primary-ish choice without filling (purple border).

---

## Sizing

- `large` → `minHeight: 48` (`touchAdult`), `paddingHorizontal: md` (16), text `buttonLarge` (Lexend 17/22 weight 600).
- `small` → `minHeight: 44` (`touchMin`), `paddingHorizontal: md` (16), text `buttonSmall` (Lexend 15/20 weight 600).

Always 8pt spacing between adjacent buttons (adult), 12pt (kid).

---

## With `iconLeft`

```tsx
<Button
  title="Pause"
  variant="outline"
  iconLeft={<Pause size={16} color={colors.primary500} weight="fill" />}
  onPress={handlePause}
/>
```

Icon size guidance: 16pt for `small`, 18pt for `large`. Use `weight="fill"` for action icons (Pause/Play/Trash), `weight="bold"` for nav icons (CaretLeft).

---

## Pressed state

All variants: `opacity: 0.85` while held. No color change.
