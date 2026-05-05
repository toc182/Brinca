# Process 01 — Decisions before opening any tool (Day 1)

> Source: `docs/research/04-design-playbook.md` · Part 2 · Phase 0
> RN note: This phase is tool-agnostic — it applies equally whether you're designing for iOS, Android, or React Native. The only caveat is the navigation structure section below (React Navigation / Expo Router) which maps conceptually to iOS tab bar + stack navigation.

Before Figma, make these decisions on paper, a whiteboard, or a notes app.

**Define your screen inventory.** List every screen your app needs. For a parenting activity tracker, your ~15 base screens likely look like this:

1. Onboarding/Welcome (1–2 screens with swipeable pages)
2. Sign Up / Login
3. Home Dashboard
4. Child Profile Creation (multi-step form)
5. Child Profile View
6. Activity List/Catalog
7. Add/Edit Activity (modal)
8. Activity Tracking — Timer Mode
9. Activity Tracking — Counter Mode
10. Activity Tracking — Checklist Mode
11. Activity In Progress (persistent banner state)
12. Completion/Summary
13. Activity History/Log
14. Statistics/Progress
15. Settings

With state variations (empty states, loading, error, populated), expect **25–35 total frames**.

**Define your navigation structure.** For this app, use **Tab Bar navigation** with 4–5 tabs — this is the iOS standard for apps with distinct top-level sections. A solid tab structure:

- **Home** (`house` icon) — Dashboard with child selector, quick actions, recent activity
- **Activities** (`list.bullet`) — Browse and manage activities
- **Stats** (`chart.bar`) — Progress charts, streaks, trends
- **Settings** (`gearshape`) — Account, children management, preferences

Within each tab, use **stack navigation** (push/pop) for drilling into details. "Add" actions use **modal sheets** that slide up from the bottom. This matches the patterns iOS users already know from every Apple app.

**Sketch rough wireframes on paper.** Spend 15–30 minutes drawing rectangles for each screen with basic boxes for UI elements. Focus on what information goes where, not how it looks. Photograph these sketches for reference.

**Map the user flows.** Draw arrows between screens showing how users move through the app. The three critical flows: (1) First-time setup: Onboarding → Sign Up → Add Child → Dashboard. (2) Track an activity: Dashboard → Select Activity → Track (timer/counter/checklist) → Complete → Summary. (3) Review progress: Dashboard → Stats → Detail view.
