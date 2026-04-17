# Document 2: `feature-specs/[feature].md` — Complete Guide

---

## 1. What it is and what it's for

A feature spec is a single Markdown file that describes how one screen or feature behaves from the user's perspective. It answers the question your vision doc deliberately doesn't: *exactly what happens when the user does X?*

The distinction between the two document types is sharp and worth internalizing:

| `product-vision.md` | `feature-specs/[feature].md` |
|---|---|
| Why the app exists | How this specific screen works |
| Stable — changes rarely | Evolving — updates as decisions are made |
| One file for the whole product | One file per screen or feature |
| Strategic context | Behavioral detail |
| Written once before build | Written just before each feature is implemented |

For your app, a feature spec file answers questions like: what does the counter look like when it hits zero? What happens if the parent closes the app mid-session — is progress saved? Can an exercise be skipped? What does the screen show when all exercises are done? These are not vision questions. They are spec questions, and they need written answers before your developer writes a line of code.

**One file per screen or feature** is the structural decision that makes this system maintainable. A single monolithic spec document becomes impossible to update and navigate. A folder of focused files means when the session logging behavior changes, you update one file and nothing else is touched.

Your `feature-specs/` folder for this app will likely include files like:

```
docs/feature-specs/
├── onboarding.md
├── child-profile.md
├── activity-plan-builder.md
├── session-logging.md
├── session-history.md
└── home-dashboard.md
```

**How this file serves your developer vs. Claude Code:**

Your developer uses it to understand intended behavior before building, flag impossibilities or conflicts early, and refer back to it when edge cases surface during implementation.

Claude Code uses it differently — it reads the spec as a behavioral contract. The acceptance criteria become a checklist it can verify its own output against. The more precise and concrete the spec, the closer the AI's first implementation lands to what you actually want. Vague specs produce implementations that are technically functional but behaviorally wrong.

---

## 2. Pre-writing checklist

Two levels: things you define once for all specs, and things you define per feature.

### Do once — applies to all feature specs

| Item | Question to answer | Why it matters |
|---|---|---|
| Navigation model | How does the user move between screens? Tab bar? Navigation stack? Modal sheets? | Every spec references how the user arrives and leaves — you need a consistent model |
| Design system basics | Are there standard components (buttons, input fields, cards) your developer is already using? | Prevents specs that describe one-off UI patterns that conflict with what's being built |
| Error handling philosophy | Does the app use inline errors, toast messages, alert dialogs, or a combination? | Every spec has error states — they need to follow a consistent pattern |
| Empty state philosophy | What does the app show when there's no data yet? | Every list screen has an empty state — define the approach once |
| Loading state philosophy | Does the app show skeletons, spinners, or optimistic UI? | Same reason — consistent pattern across all specs |
| Data persistence rules | Is everything saved automatically, or does the user explicitly save? | Affects every screen that captures input |
| Backend reality | What does the partially-built backend already support? What's not built yet? | Prevents specs that describe behavior the backend can't support in V1 |

### Do per feature — before writing each spec file

| Item | Question to answer |
|---|---|
| Entry points | How does the user get to this screen? From where? |
| Primary action | What is the one thing this screen exists to let the user do? |
| All possible states | What does this screen look like when: empty, loading, populated, error, success? |
| All user actions | What can the user tap, swipe, type, or trigger on this screen? |
| All edge cases | What happens at the boundaries? Zero items, maximum items, network failure, interrupted flow? |
| Exit points | Where can the user go from this screen? What triggers each transition? |
| What the backend provides | What data does this screen read? What does it write? |
| Open questions | What do you not know yet about this screen's behavior? |

### When to write a spec vs. when a conversation is enough

Not every feature needs a full spec file. Use this filter:

- **Write a spec** if the feature has multiple states, edge cases, or branching behavior — or if your developer will implement it without you present
- **Write a spec** if Claude Code will implement it
- **A conversation is enough** if the feature is a single, obvious UI element with no edge cases and your developer is implementing it the same day

For your app, every screen in the core loop (onboarding → plan creation → session logging → history) needs a full spec. Minor UI elements like a settings toggle or a version number in the footer do not.

---

## 3. Step-by-step creation process

**Step 1 — Name the file before you write anything.**
Use lowercase, hyphenated names that match what the screen does: `session-logging.md`, not `screen3.md` or `the-main-thing.md`. The filename is referenced from `CLAUDE.md` and used by your developer — clarity matters.

**Step 2 — Define the screen's single primary action.**
Before describing any states or flows, write one sentence: "This screen exists to let the parent [do X]." If you can't write that sentence, the screen's scope is unclear and you're not ready to spec it.

**Step 3 — List every state the screen can be in.**
Before writing prose, brainstorm states: loading, empty, populated, error, success, partial completion, interrupted. Write them as a bullet list first. You'll turn these into full descriptions in the template — but listing them first ensures you don't miss one.

**Step 4 — List every action the user can take.**
Again, bullet list first: every tap target, every swipe gesture, every form input, every system event (app backgrounded, timer runs out, phone call interrupts). You'll describe each one's behavior in the template.

**Step 5 — Write the happy path first.**
The happy path is what happens when everything goes right and the user does exactly what you expect. Write this as a numbered flow before handling any edge cases. This becomes the narrative backbone of the spec.

**Step 6 — Write edge cases and error states.**
For each action identified in Step 4, ask: what can go wrong? What happens at zero? What happens at the maximum? What happens if the network drops? What if the user interrupts mid-flow? Write one behavior per case — not how to implement it, just what the user experiences.

**Step 7 — Write acceptance criteria.**
These are the pass/fail tests for the feature. Write them in checkbox format: "[ ] When the parent taps the counter, the count increments by 1 and the updated number is immediately visible." Each criterion should be testable by someone who has never seen your code.

**Step 8 — Review with your developer before they start.**
Ask one question: "Is there anything here you can't build, or that would require a different approach than what I've described?" This surfaces technical conflicts before they become mid-build surprises. Update the spec to reflect any agreed changes.

**Step 9 — Update the spec as the feature is built.**
When your developer says "this won't work, we need to do Y instead" — update the spec to describe Y. The spec should always reflect what's being built, not the original ideal. A spec that diverges from implementation is worse than no spec.

---

## 4. The template

The example feature used throughout is **Session Logging** — the core screen where a parent works through a plan's exercises and records completion. Copy everything below into `docs/feature-specs/session-logging.md` and adapt it. The pattern — not the content — is what you're replicating for other features.

---

```markdown
# Feature spec — Session logging

**Screen name:** Session logging
**File:** `docs/feature-specs/session-logging.md`
**Last updated:** [Date]
**Status:** Draft / Ready for dev / In development / Shipped
**Related vision doc:** `docs/product-vision.md`

---

## Purpose

*One sentence. What does this screen exist to let the user do?*

This screen exists to let a parent work through a child's activity plan one exercise at a time and record the completion of each exercise during a live session.

---

## Entry points

*How does the user arrive at this screen? List every path.*

- Taps "Start session" on the home dashboard for a specific child's active plan
- Taps "Resume session" if a session was started but not completed (see: interrupted sessions)

---

## Screen states

*Every state this screen can be in. Describe what the user sees in each one.*

### Loading
The screen shows a skeleton layout — exercise list items as gray placeholder bars — while the plan data loads. Duration: should resolve in under 1 second on a normal connection. If loading exceeds 3 seconds, show: "Taking longer than usual… still loading."

### Active session — default
Displays the plan name at the top (e.g., "Tuesday PT — Andrei"). Below it, a progress indicator showing how many exercises are complete out of total (e.g., "3 of 8 complete"). Below that, the full exercise list. Each exercise row shows:
- Exercise name
- The tracking type for that exercise (counter, timer, or checklist item)
- The target value (e.g., "10 reps," "2 minutes," "1× done")
- The current value (starts at 0 or unchecked)
- A visual indicator of completion status (incomplete / in progress / complete)

The current/next exercise is visually emphasized. Completed exercises are visually de-emphasized (not hidden — the parent needs to see the full plan).

### All exercises complete
When all exercises in the plan have been marked complete, the progress indicator reads "8 of 8 complete" and a prominent "Finish session" button appears at the bottom. The button was not visible until this state. No exercises are auto-submitted — the parent must tap "Finish session" explicitly.

### Session saved confirmation
After tapping "Finish session," the screen briefly shows a confirmation state: "Session saved — [date and time]." After 2 seconds, the app navigates back to the home dashboard. The completed session is now visible in the session history.

### Interrupted / partially complete
If the parent leaves the screen mid-session (backgrounds the app, navigates away), progress is auto-saved. When they return, the "Resume session" entry point is available. The session is not counted as complete until "Finish session" is tapped. A partially saved session is stored but visually distinct in session history (e.g., labeled "Incomplete").

### Error — failed to save
If the session cannot be saved (network failure at the moment of "Finish session"), show an inline error: "Couldn't save your session. Check your connection and try again." The "Finish session" button remains available. Do not lose the session data. Retry automatically when connection is restored.

---

## Exercise tracking types

*This screen supports three tracking types. Each behaves differently.*

### Counter
Used for exercises measured in repetitions (e.g., "10 leg raises").

- Displays: current count / target (e.g., "7 / 10")
- The parent taps a large "+" button to increment. Each tap = +1.
- When count reaches target, the exercise is automatically marked complete. The row shows a completion indicator.
- The parent can continue tapping past the target (some sessions exceed the prescribed reps). The count continues to increment. The exercise remains marked complete.
- The parent can tap a "−" button to decrement if they tapped by mistake. Count cannot go below 0.
- There is no manual text entry for the counter in V1.

### Timer
Used for exercises measured in duration (e.g., "Hold for 2 minutes").

- Displays: a countdown from the target duration (e.g., "2:00")
- The parent taps "Start" to begin the countdown.
- The timer counts down. At 0:00, the device vibrates once and the exercise is automatically marked complete.
- The parent can tap "Pause" to pause the timer (e.g., child needs a break). A paused timer shows "Paused" and a "Resume" button.
- The parent can tap "Reset" to restart from the target duration. Resetting does not mark the exercise incomplete if it was already complete.
- If the app is backgrounded while a timer is running, the timer continues running in the background. On return, the display reflects the current remaining time.
- There is no way to manually enter a duration or skip the timer in V1.

### Checklist item
Used for binary exercises — either done or not done (e.g., "Completed verbal exercise").

- Displays: the exercise name and a checkbox (unchecked by default).
- The parent taps the checkbox to mark it complete. The checkbox fills and the exercise shows a completion indicator.
- Tapping a completed checkbox unchecks it (in case of mis-tap).

---

## User actions and behaviors

*Every tap target and gesture on this screen, and what happens.*

| Action | Behavior |
|---|---|
| Tap "+" on counter | Count increments by 1. If count = target, exercise marked complete. Haptic feedback on each tap. |
| Tap "−" on counter | Count decrements by 1. Minimum value: 0. No haptic on decrement. |
| Tap "Start" on timer | Countdown begins from target duration. Button changes to "Pause." |
| Tap "Pause" on timer | Countdown pauses. Button changes to "Resume." |
| Tap "Resume" on timer | Countdown resumes from current value. Button changes to "Pause." |
| Tap "Reset" on timer | Countdown resets to target duration. Paused state. Exercise completion status unchanged. |
| Tap checkbox (unchecked) | Checkbox marked complete. Exercise shows completion indicator. |
| Tap checkbox (checked) | Checkbox unchecked. Completion indicator removed. |
| Tap "Finish session" | Session saved. Confirmation state shown for 2 seconds. Navigate to home dashboard. |
| Tap back / swipe to dismiss | If session is in progress: show confirmation dialog — "Leave session? Your progress will be saved." Options: "Stay" / "Leave." If "Leave": auto-save and navigate back. Session marked incomplete. |
| App backgrounded mid-session | Auto-save current progress. Timer (if running) continues in background. |

---

## Edge cases

| Scenario | Expected behavior |
|---|---|
| Plan has 0 exercises | This state should not be reachable — a plan requires at least 1 exercise to be saved. If somehow reached, show: "This plan has no exercises. Edit the plan to add some." with a button to navigate to the plan editor. |
| Counter target is 0 | Not allowed — exercise targets must be ≥ 1. Validated at plan creation. |
| Timer target is 0 seconds | Not allowed — validated at plan creation. |
| Two exercises have the same name | Allowed. They are treated as separate exercises. No deduplication. |
| Network drops mid-session | Session data is held locally. Saving is retried automatically. No data loss. |
| Phone call interrupts session | App backgrounds. Timer pauses. Progress auto-saved. |
| Session already exists for today | Allowed. Multiple sessions per day per plan are permitted. Each is stored as a separate session record. |
| Parent taps "Finish session" with incomplete exercises | Not possible — "Finish session" button is only visible when all exercises are complete. Early exit uses the back/dismiss action, which saves an incomplete session. |

---

## Navigation and exit points

| Trigger | Destination |
|---|---|
| "Finish session" tapped and saved | Home dashboard |
| Back / swipe dismiss → "Leave" | Home dashboard (session saved as incomplete) |
| Back / swipe dismiss → "Stay" | Remains on session logging screen |
| Error state — tap retry | Remains on session logging screen, retries save |

---

## Data written by this screen

*What this screen sends to the backend when a session is saved.*

- Session ID (generated client-side)
- Child ID
- Plan ID
- Start timestamp
- End timestamp
- Completion status: complete / incomplete
- Per-exercise record:
  - Exercise ID
  - Tracking type (counter / timer / checklist)
  - Target value
  - Recorded value (final count, total duration elapsed, or boolean)
  - Completed: true / false

*Note: confirm with developer whether partial session data is stored incrementally or only on final save.*

---

## Acceptance criteria

*Pass/fail tests for this feature. Each criterion must be testable without reading the code.*

**Counter**
- [ ] Tapping "+" increments the counter display by 1 immediately
- [ ] Tapping "−" decrements the counter display by 1, minimum value is 0
- [ ] When counter reaches the target value, the exercise row shows a completion indicator without any additional tap
- [ ] Counter can be incremented past the target value; exercise remains marked complete
- [ ] Haptic feedback fires on each "+" tap

**Timer**
- [ ] Tapping "Start" begins a countdown from the target duration
- [ ] Tapping "Pause" stops the countdown; display holds the current value
- [ ] Tapping "Resume" continues the countdown from the paused value
- [ ] When the countdown reaches 0:00, the exercise is automatically marked complete and the device vibrates once
- [ ] Tapping "Reset" returns the timer to the target duration in a paused state
- [ ] If the app is backgrounded while the timer is running, the timer continues; on return the display reflects the correct remaining time

**Checklist**
- [ ] Tapping an unchecked checkbox marks it complete and shows the completion indicator
- [ ] Tapping a checked checkbox unchecks it and removes the completion indicator

**Session flow**
- [ ] Progress indicator updates correctly after each exercise completion
- [ ] "Finish session" button is not visible until all exercises show a completion indicator
- [ ] Tapping "Finish session" saves the session and navigates to the home dashboard after a 2-second confirmation
- [ ] Tapping back mid-session shows a confirmation dialog with "Stay" and "Leave" options
- [ ] Choosing "Leave" saves the session as incomplete and navigates to the home dashboard
- [ ] A session saved as incomplete is visible in session history and labeled distinctly from complete sessions
- [ ] If the save fails, an inline error message is shown and the session data is not lost

---

## Open questions

*Unresolved decisions about this screen. Each should be answered before implementation starts.*

- [ ] Should completed exercises collapse or stay visible at full height? (Collapsing saves space but may feel disorienting mid-session)
- [ ] Is there a time limit on a session? If a parent starts a session and comes back 6 hours later, is that one session?
- [ ] Should the app speak exercise names aloud (accessibility / hands-free use), or is that V2?
- [ ] What happens if the child's plan is edited by the parent while a session is in progress?

---

## Mockups

*Link to Figma, attach an image, or describe the layout if no mockup exists yet.*

[Link to Figma file / annotated screenshot]
*Or: "No mockup yet — layout to be determined by developer based on spec above."*
```

---

## 5. Common first-timer mistakes

| Mistake | Why it happens | How to fix it |
|---|---|---|
| Speccing the happy path only | The happy path is what you've been imagining — edge cases feel hypothetical | For every user action in your spec, ask "what can go wrong?" and "what happens at zero?" before moving on |
| Writing "show an error" without specifying the error message | Error text feels like a detail | Error messages are not details — they're the only communication the user has when something fails. Write the exact string |
| Describing UI appearance instead of behavior | Designers naturally think visually | A spec is not a mockup. Instead of "the button is blue and rounded," write "tapping this button does X." Appearance lives in Figma, behavior lives in the spec |
| One giant spec file for the whole app | Feels efficient to keep everything together | When anything changes, you're editing a 20-page document. Split by screen. Each file should be fully replaceable without touching any other |
| Acceptance criteria that test implementation, not behavior | Easy to slip into technical language | Acceptance criteria are written from the user's perspective: "The progress indicator updates immediately after the exercise is marked complete." Never reference code internals |
| Leaving open questions unanswered when implementation starts | Feels like everything else is ready, questions can be resolved later | Open questions are blockers. If a question is still open when your developer starts, they'll answer it themselves — possibly wrong. Resolve every open question before marking a spec "ready for dev" |
| Forgetting that the spec is also for Claude Code | Writes the spec for the human developer only | After writing each acceptance criterion, ask: "Could Claude Code use this sentence to verify its own output?" If it's ambiguous, make it more concrete |
| Not updating the spec when implementation diverges | Updating the spec feels like extra work after the decision is made | A diverged spec is actively harmful — it becomes incorrect documentation. Treat spec updates as part of the implementation task, not optional cleanup |

---

## 6. "Done enough" checklists

### Done enough to hand off to a human developer

- [ ] The purpose statement is one sentence and describes what the user does, not what the screen is
- [ ] Every screen state is named and described — including loading, empty, error, and success
- [ ] Every tap target and gesture has a described behavior
- [ ] Every edge case that surfaced during the pre-writing exercise has an expected behavior
- [ ] Every error state has an exact error message string, not a placeholder
- [ ] The data written by this screen is listed (even informally — a bullet list is fine)
- [ ] All open questions are resolved and removed from the open questions section
- [ ] Your developer has reviewed it and confirmed there are no technical blockers
- [ ] The spec describes behavior, not implementation — no references to variable names, functions, or architecture

### Done enough to use as Claude Code context

- [ ] The purpose statement, entry points, and acceptance criteria are specific enough that Claude could implement the screen without asking clarifying questions
- [ ] Every acceptance criterion is written as a testable user-observable outcome (no code internals)
- [ ] Exact strings are provided for all visible text: button labels, error messages, empty states, confirmation messages
- [ ] Every tracking type (counter, timer, checklist) has fully described behavior including edge cases
- [ ] Navigation triggers are explicit: "tapping X navigates to Y" — not "the user can go back"
- [ ] The data model section tells Claude what to write and where, even informally
- [ ] The spec is in the `docs/feature-specs/` folder and is referenced from `CLAUDE.md`
