# Form input

Text input with all five states (default, focused, filled, error, disabled).

Default height 48pt (kid: 56pt). Radius 10pt. Static top labels (8pt above input).

For inline validation errors and the input's error visual treatment, see `docs/design-system/components/inline-form-error.md`.

---

## State matrix

| Property | Default | Focused | Filled | Error | Disabled |
|---|---|---|---|---|---|
| Border width | 1pt | 2pt | 1pt | 1.5pt | 1pt |
| Border color | `border-default` | `primary-500` | `border-default` | `error-500` | `border-default` |
| Background | `surface` | `surface` | `surface` | `error-50` @ 40% | `surface-disabled` |
| Text color | `text-primary` | `text-primary` | `text-primary` | `text-primary` | `text-disabled` |
| Placeholder | `text-placeholder` | — | n/a | `text-placeholder` | `text-disabled` |
| Caret | `primary-500` | `primary-500` | `primary-500` | `error-500` | none |
| Focus halo | none | 3pt `primary-500` @ 24% | none | none | none |

---

## Label

| Property | Value |
|---|---|
| Position | Above input, 8pt gap |
| Font | Lexend 14/20, weight 600 |
| Color | `text-primary` / `error-700` on error / `text-disabled` disabled |
| Required indicator | Trailing `*` in `error-500` |

---

## Adult vs kid

| Property | Adult | Kid |
|---|---|---|
| Input height | 48pt | 56pt |
| Input text | 15pt | 17pt |
| Label | 14pt | 16pt |
| Row spacing | 8pt | 16pt |
