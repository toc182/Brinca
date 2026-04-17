# Artifact 4 — Grid and layout system

> Source: `docs/research/04-design-playbook.md` · Part 1 · Section 4
> RN note: Safe-area and navigation chrome is handled via `SafeAreaView` and Expo Router. The zone heights still apply — use them for `keyboardVerticalOffset`, scroll padding, and anything that needs to clear the header or tab bar.

**What it is:** An invisible structure that defines how content is arranged on the screen — columns, margins, and vertical rhythm.

**What it's for:** It gives every screen the same underlying skeleton, so elements across different screens align consistently.

**Why before screens:** Setting the grid first means every screen you create starts from the same structural foundation.

**Your iOS grid setup in Figma:**

Start with an iPhone frame of **393 × 852 points** (iPhone 15 / 16 standard, the most common modern size). Then apply two layout grids:

- **Columns:** 4 columns, Stretch type, **16pt margin** on each side, **8pt gutter** between columns
- **Rows:** 8pt row grid for vertical rhythm (helps align elements vertically)

**iOS screen anatomy — memorize these zones (top to bottom):**

| Zone | Height | What it is |
|------|--------|-----------|
| Status bar + Dynamic Island | **59pt** (standard) or **62pt** (iPhone 16 Pro) | System area — never place interactive content here |
| Navigation bar (inline title) | **44pt** | Back button, screen title, action buttons |
| Navigation bar (large title) | **96pt** | 44pt bar + 52pt large title area; collapses on scroll |
| Scrollable content area | Flexible | Your actual screen content |
| Tab bar | **49pt** | 3–5 tabs with icons and labels |
| Home indicator | **34pt** | System gesture area — never place buttons here |

**Total non-content chrome:** ~137pt top (status + large title nav) + ~83pt bottom (tab bar + home indicator) = **~220pt unavailable for content** on a typical screen. Your scrollable content area on a 393×852 frame is roughly **632pt**.
