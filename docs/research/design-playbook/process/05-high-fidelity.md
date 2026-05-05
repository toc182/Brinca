# Process 05 — High-fidelity design and prototyping (Days 7–13)

> Source: `docs/research/04-design-playbook.md` · Part 2 · Phases 4 and 5
> RN note: For Brinca, we prototype by running the app itself on a device (`bun run dev`), not by building Figma prototypes. The Phase 5 content is included here for reference but in practice we skip Figma prototyping.

## Phase 4 — High-fidelity design

Replace wireframe placeholders with your actual components. Apply color styles, typography, and spacing from your design system. This is where the investment in artifacts pays off — you're assembling pre-built pieces, not designing from scratch.

**Work systematically:** For each screen, apply the navigation bar component, apply the tab bar, place content components using Auto Layout with spacing from your scale, and apply colors from your Variables. Every value should come from a defined style or variable — if you're typing a raw hex code or custom font size, stop and add it to your system first.

**Design these screen states for critical screens:** Default (populated with realistic data), Empty (no data yet), Loading (skeleton placeholders — gray shapes mimicking the final layout), and Error (inline banner with retry button). At minimum, design empty and default states for Dashboard, Activity List, History, and Statistics.

**Consistency checkpoint — verify before moving on:**
- Every color references a named Variable (no raw hex values)
- Every text layer uses a Text Style (no custom sizes)
- Every repeated element is a component instance (not a detached copy)
- Spacing between elements follows your 8pt grid
- Navigation bars and tab bars are identical across all screens
- Touch targets are at minimum **44×44pt** for every interactive element
- All icons are the same SF Symbol weight throughout

---

## Phase 5 — Prototype and test (optional for this project)

Switch to Prototype mode (`Shift+E`), connect screens by dragging connection points from interactive elements to destination frames, and set appropriate transitions:

- **Tab bar taps:** Instant transition (no animation) to other tab screens
- **Push navigation** (tapping into a detail screen): "Slide In" from right, 300ms, Ease In and Out
- **Back navigation:** "Slide Out" to right
- **Modal presentations** (Add Activity, Add Child): "Move In" from bottom, 300ms
- **Modal dismissal:** "Move Out" to bottom

Prototype these five critical flows: (1) Tab switching across all main screens, (2) Add Child: Settings → Add Child form → Confirmation, (3) Create Activity: Activity List → New Activity form → Configure type → Save, (4) Track Activity: Select → Timer/Counter/Checklist interaction → Complete → Summary, (5) View Stats: Dashboard → Statistics → Detail view.

**Test on your actual iPhone** using the Figma Mirror app or by opening the prototype share link in Safari. Tap through every flow. Ask someone who hasn't seen the app to complete a task ("add a child and start tracking an activity") and watch where they hesitate. Fix navigation issues now — they're cheap to fix in Figma and expensive to fix in code.
