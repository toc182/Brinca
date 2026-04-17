# Product vision — Brinca

> A configurable activity tracking app for parents, therapists, and coaches who do structured practice with children.

**Last updated:** April 11, 2026
**Owner:** Ivan
**Status:** Draft

---

## Problem statement

Parents, therapists, and coaches who run structured practice sessions with children want to track progress consistently and motivate their kids to keep showing up. They need a tool they can configure from scratch for each child's specific activities — baseball drills, therapy exercises, multiplication practice — because no two children work on the same things. Today they rely on memory, paper logs, or generic apps with rigid formats. Sessions go unrecorded, and without consistent data there's no way to know if the child is actually improving.

---

## Target users

**Primary users:** Brinca is used by parents, therapists, and coaches who run repeated, structured practice sessions with specific children. They show up consistently — daily or several times a week — with a plan for what to work on, and they need to record what happened without it becoming a chore. Some work alone with a child; others share access to the same child's account so both can see the progress being made in real time.

**Persona — Ivan**
Father of three, Panama. Runs daily baseball and karate practice with his 9-year-old son. Frustrated that after weeks of consistent work he can't easily show his son how far he's come, and has no system to keep his son motivated when progress feels invisible.

**Persona — María**
Occupational therapist, sees 8–12 children per week. Tracks each child's session progress manually between appointments. Frustrated that she arrives at each session without a clear record of what was done at home, making it hard to adjust her approach or give parents visibility into the work being done in her sessions.

---

## Goals

- [ ] Minimize the time required to log a session so tracking doesn't become a burden
- [ ] Parents see a clear history of sessions completed over time, giving them confidence their child is making progress
- [ ] Therapists can see what a child did at home between appointments without asking the parent, enabling them to adjust their approach
- [ ] Children are motivated to complete sessions through a visible reward system they understand

---

## Non-goals for V1

- **Kids view or companion app** — a child-facing interface is meaningful but requires significant additional design and safety considerations; V1 is caregiver-facing only
- **Therapist-to-parent messaging** — communication between caregivers happens outside the app in V1; Brinca shares data, not messages
- **Appointment scheduling** — Brinca tracks practice sessions, not clinical appointments
- **Activity and drill template sharing between users** — templates are private to the account that created them in V1
- **Therapist pushing exercise modules to parent accounts** — caregivers configure their own activities independently in V1
- **Web version** — iOS only for V1
- **Android optimization** — iOS primary for V1; Android is not actively tested or optimized
- **Apple Watch app and sync** — out of scope for V1

---

## Key use cases

**Use case 1 — Logging a baseball practice session**

Ivan gets home at 6:30 PM. His son Andrei is waiting outside with his glove. They practice three of their configured baseball drills: consecutive catches, ultimate challenge, and high balls. When practice ends, Ivan opens Brinca, taps Andrei's profile, and starts a baseball session. For the first drill — consecutive catches — he enters 64, adds a note "struggled with left-side balls," and moves to the next one. He logs ultimate challenge (3 rounds completed) and high balls (7 catches). When he marks the session complete, Brinca shows which drills hit their session goals and which are working toward reward goals. Andrei sees his consecutive catches are at 64 toward the 100-catch reward. Total practice time: 30 minutes. Total logging time: under 2 minutes. Andrei asks to practice again tomorrow.

**Use case 2 — Logging therapy exercises at home**

María's 8-year-old son just started Dr. Melillo's primitive reflex integration program. The therapist gave her a prescribed list of 18 exercises to do daily. On her first day, María opens Brinca, creates a new activity called "Dr. Melillo Therapy," and configures all 18 exercises — some are timed (hanging hold, balance board), some are counted (reps), and some are just checked off. For exercises her son hasn't done before, she attaches instructional videos so he can watch and understand what to do. That evening, she starts a session. Her son does the first exercise — primitive reflex integration — and María marks it complete. On the next exercise — hanging hold — she taps the timer button and lets it run while he hangs. When he drops, she logs the time (12 seconds) and moves to the next drill. She works through all 18 exercises, logging times and reps as they go. Total session time: 20 minutes of practice, under 3 minutes to log. Over the next two weeks, as her son improves, María increases the targets — the hang time goes from 12 to 20 seconds, reps increase. Brinca shows her the progression week by week.

**Use case 3 — Therapist reviewing home progress and adjusting the session**

Dr. García, a speech therapist, opens Brinca on Friday morning before her first client arrives. The child, Lucas, was last in her office on Tuesday. She taps his profile and sees his home practice log for Wednesday and Thursday — his mom logged two sessions, each with notes. On Wednesday: "Did 5 of 8 exercises, struggled with the tongue placement drill." On Thursday: "Completed all 8, but still not confident on #6." Dr. García reads these notes and realizes Lucas needs more scaffolding on that specific exercise before moving forward. She adjusts today's session plan — instead of introducing the new exercise, she'll spend 20 minutes reinforcing #6 with different techniques. She starts the session timer and works through the adjusted plan. When the session ends, she logs what they actually did: completed 6 exercises, spent extra time on tongue placement, introduced a new game-based approach. She adds a note: "Lucas responded well to the game format. Mom should try this at home." When Lucas's mom opens the app that evening, she sees Dr. García's note and the session log — now she knows exactly how to practice at home and what approach is working.

---

## Constraints

- **Platform:** iOS primary. Android supported by default via Expo but not actively tested or optimized for V1
- **Minimum iOS version:** iOS 16+
- **Framework:** React Native 0.83.4 on Expo SDK 55, New Architecture enabled, Expo Router v5
- **Language:** TypeScript strict mode
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions, RLS)
- **Local storage:** expo-sqlite (offline data), MMKV v4 (persistent UI state), expo-secure-store (auth tokens only)
- **State management:** TanStack Query v5 (server state), Zustand v5 (client state)
- **Offline-first:** Writes go to SQLite immediately; background sync to Supabase when connected
- **Build/deploy:** EAS Build (iOS), EAS Update (OTA)
- **Crash reporting:** Sentry SDK 8
- **Monetization:** Freemium. RevenueCat planned, not yet integrated
- **Compliance:** COPPA — deadline April 22, 2026
- **Team:** Ivan (product owner) + Luis Eduardo Guillén (developer)
- **Package manager:** Bun
- **Services:** Supabase, EAS, Sentry, RevenueCat, Claude
- **Launch date:** TBD

---

## Success metrics

| Metric | Target | Time window | Notes |
|---|---|---|---|
| Sessions logged per active user per week | TBD after first 30 days | Ongoing | North Star — core value delivery indicator |
| Retention at 30 days | TBD after first 30 days | 30 days post-registration | % of users still active one month after signing up |
| Onboarding completion rate | > 80% | Ongoing | User registered → first child created → first activity configured → first session logged |
| Weekly active users | TBD after first 30 days | 90 days post-launch | Proxy for habit formation and retention |
| Reward system adoption | TBD after first 30 days | 90 days post-launch | % of active users with at least one reward configured |

*Note: TBD targets to be defined after the first 30 days of real usage.*

---

## Competitive context

Parents and therapists who track structured practice sessions with children currently rely on generic habit trackers, notes apps, or paper logs. Habit trackers are the closest alternative — some are highly configurable — but they are built for self-tracking, not for one person managing and recording another person's progress. They have no concept of child profiles, no way to share access between a parent and a therapist working with the same child, and no reward system designed to motivate kids. Clinical therapy software exists but is expensive, complex, therapist-facing, and not designed for daily home use by parents. Brinca fills the gap between these two categories: a fully configurable activity tracking tool built specifically for the dynamic between a caregiver and a child, with collaborative access for everyone involved in that child's development.

---

## Open questions

- [ ] Who controls access to a child's account — the parent, the therapist, or whoever created it first?
- [ ] What happens if a therapist is the only user and a parent joins later — is there an ownership transfer?
- [ ] What are the target numbers for success metrics — to be defined after first 30 days of real usage
- [ ] Should the reward system be visible to the child directly on the app, or only managed by the parent?
- [ ] What happens to a child's data if one of two users with access deletes the account?
- [ ] Should the app support multiple languages for V1?
- [ ] Is there a maximum number of children per account, or is it unlimited?
- [ ] Should there be a way to archive or deactivate a child's profile without deleting their history?
- [ ] Should activities and drill templates be shareable between users or always private?
- [ ] What happens to session data if interrupted by battery death, app crash, or user closing the app mid-session?
- [ ] Should push notifications and reminders be included in V1?
- [ ] Should progress analytics and charts be included in V1?
- [ ] Should session reports and summaries be included in V1?
- [ ] Should video upload for sessions and drill instructions be included in V1?
- [ ] Should the app support multiple languages in V1?

---

## Milestones

**V1 — Core tracking loop + collaboration**
The smallest version that delivers real value: a parent, therapist, or coach can create an account, add children, configure custom activities with drills, log sessions with timers and counters, track progress over time, motivate children through a reward system, and share access to a child's account with other caregivers.

**V2 — Engagement and visibility**
- Push notifications and reminders
- Progress analytics and charts
- Session reports and summaries
- Video upload for sessions and drill instructions
- Multiple language support

**Later / not scheduled**
- Kids view or kids companion app
- Therapist can create and push exercise modules to parent accounts
- Activity and drill template sharing between users
- Web version
- Android optimization
- Apple Watch app and sync
- Appointment scheduling
- Therapist-to-parent messaging
- Session editing — ability to edit recorded drill values, timers, and notes after a session is completed
- Simultaneous multi-child session tracking for therapists managing multiple children at once
- Drill-level performance stats — charts showing individual drill values over time (e.g. consecutive catches per session, hang time progression)
