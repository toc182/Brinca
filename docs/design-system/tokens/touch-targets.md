# Touch targets

Four named tiers — 44pt is the absolute floor; 48pt is the default for adult UI; kid screens go larger.

**Implementation:** sizes live in `src/shared/theme.ts`. Use on `Pressable` and any interactive element.

---

## Tokens

| Token | Size | Use |
|---|---|---|
| `touchMin` | 44×44 pt | Absolute minimum, adult data-dense — HIG floor, no exceptions |
| `touchAdult` | 48×48 pt | Default adult UI |
| `touchKid` | 56×56 pt | Kid-facing primary (ages 10–12) |
| `touchKidLarge` | 64×64 pt | Kid hero CTAs, onboarding (ages 7–9) |

---

## Spacing between adjacent targets

- Adult: 8pt minimum
- Kid: 12pt minimum
