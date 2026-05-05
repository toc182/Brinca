# Capi — Brinca's mascot

A capybara character that appears on kid-facing surfaces to provide encouragement and context.

---

## Identity

- **Name:** Capi (identical in English and Spanish)
- **Species:** Capybara (South American, culturally resonant, TikTok-relevant for 7–12)
- **Backup names:** Rumi, Pipo

---

## Personality

Four traits, in order of priority:

- **Encouraging** — celebrates effort, not only success; growth-mindset aligned
- **Playful** — light humor, never sarcastic, never shames
- **Curious** — invites exploration ("How did that go?")
- **Steady** — does not judge missed days; no anxiety-inducing guilt

> **Constraint:** Capi has no sad or angry expressions. Never depict negative emotion states.

---

## Expression states

Six states — no sad, no angry.

| State | Context | Visual |
|---|---|---|
| Happy | Default, idle | Slight smile, eyes open |
| Cheer | Session complete, goal hit | Arms up, bounce pose, sparkle particles |
| Encouraging | Mid-session, streak save | Thumbs up, eyes wide |
| Neutral / Thinking | Loading, empty state | Looking up, pondering |
| Sleepy | Late night, rest day | Eyes closed, ZZZ — signals rest is okay |
| Celebratory | Major milestone, badge unlock | Confetti, big grin, full-body Lottie |

---

## Visual style

- Soft-flat vector with two-tone fills and one subtle inner-shadow
- No hard outlines
- Body: `primary-500` `#6D4AE0`, belly: `secondary-500` `#14B8A6`, cheek blush: `accent-500` `#FF8A3D`
- Legible at 24px, expressive at 200px

---

## Delivery

- Lottie JSON for idle + 6 states + hero celebration
- Static SVGs for empty states
- Budget: ~250KB total
- Respect `AccessibilityInfo.isReduceMotionEnabled` — fall back to static SVG

---

## Where Capi appears

- Onboarding illustrations
- Kid-view empty states (uses Neutral / Thinking expression)
- Celebration animations (session complete, goals, streaks)
- Achievement / badge unlocks
- Reward / sticker-book
- Splash screen
- Push notifications to kid-profile devices

## Where Capi does NOT appear

- Adult dashboard
- Session logging forms and data entry
- Settings, account, billing, privacy
- Clinical notes and therapy documentation
- Data tables and weekly summaries (adult)
- Error alerts
- Permissions dialogs, auth
- Any screen likely screenshotted for medical records
