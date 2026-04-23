# Audit — Session Logging

**Feature spec:** `docs/feature-specs/session-logging.md`
**UX conventions:** `docs/ux-conventions.md`
**Audit date:** 2026-04-21
**Auditor:** Claude (QA compliance audit)
**Status:** Draft

---

## 1. Summary

The session logging feature has a solid structural foundation — all 18 element types have dedicated renderers, the navigation model is correctly wired, and the core flow (session start -> drill logging -> finish -> summary) works at a basic level. However, compliance with the spec is **moderate at best (~55% fully passing)**. The biggest gaps are: (1) **no auto-save of element values** — values live in React `useState` and are lost on app crash or unmount; (2) **missing Reset buttons with alert confirmations** on all counters and most timers; (3) **no sound/vibration/haptic feedback** anywhere (countdown alert, interval transitions); (4) **no drill-level notes or photo attachments** on the drill screen; (5) **no session-level photo attachment**; (6) **Voice Note is a non-functional stub**; (7) **session summary is missing drills logged list, level progress, and bonus UI**; (8) the **2-hour inactivity auto-pause** is not implemented; (9) **SingleSelect cannot deselect**. Several of these are CRITICAL because they represent core spec behaviors that users would notice immediately.

---

## 2. Gap table

| # | Spec requirement | Status | Severity | Gap description | File(s) |
|---|---|--------|----------|-----------------|---------|
| 1 | Element auto-save: every element auto-saves state after each interaction; state survives app close/minimize/background | MISSING | CRITICAL | Element values live in React `useState` inside DrillScreen. They are only persisted to SQLite when "Finish drill" is tapped. If the app crashes or is killed mid-drill, all element progress is lost. | `src/features/session-logging/screens/DrillScreen.tsx` |
| 2 | Drill screen: notes field (optional free text, no character limit) | MISSING | CRITICAL | DrillScreen has no notes TextInput. Only session-level notes exist. | `src/features/session-logging/screens/DrillScreen.tsx` |
| 3 | Drill screen: photo attachment (opens camera or library, photos only) | MISSING | CRITICAL | No photo attachment UI on DrillScreen. | `src/features/session-logging/screens/DrillScreen.tsx` |
| 4 | Session screen: photo attachment on session notes | MISSING | CRITICAL | SessionNotes is a plain TextInput with no photo picker. | `src/features/session-logging/components/SessionNotes.tsx` |
| 5 | Session summary: shows drills logged with completion status | MISSING | CRITICAL | Summary shows duration, earnings, and accolades only — no drill list. | `src/features/session-logging/screens/SessionSummaryScreen.tsx` |
| 6 | Session summary: "Add bonus" button with preset picker and reason field | MISSING | CRITICAL | `useAddBonusMutation` exists but no UI calls it. No bonus button on summary screen. | `src/features/session-logging/screens/SessionSummaryScreen.tsx` |
| 7 | Session summary: level progress display | MISSING | CRITICAL | No level progress bar or indicator on summary screen. | `src/features/session-logging/screens/SessionSummaryScreen.tsx` |
| 8 | Session timer: auto-pauses after 2 hours of inactivity | MISSING | CRITICAL | No inactivity detection. Timer runs forever. | `src/features/session-logging/hooks/useSessionTimer.ts` |
| 9 | Session timer: banner on return "Your session was paused due to inactivity. Resume?" | MISSING | CRITICAL | No inactivity banner. | `src/features/session-logging/screens/SessionScreen.tsx` |
| 10 | Drill with no tracking elements: "Mark complete" button on session screen (no drill screen needed) | MISSING | CRITICAL | DrillListItem always navigates to drill screen regardless of element count. | `src/features/session-logging/screens/SessionScreen.tsx` (L92-104), `src/features/session-logging/components/DrillListItem.tsx` |
| 11 | Session timer: auto-start when session begins | MISSING | CRITICAL | `useSessionTimer().start()` is never called. The timer reads MMKV but nothing writes the initial `startTime`. | `src/features/session-logging/screens/SessionScreen.tsx`, `src/features/session-logging/hooks/useSessionTimer.ts` |
| 12 | Voice note: functional recording (expo-audio) | MISSING | CRITICAL | Entire component is a stub with hardcoded `'recording-stub.m4a'`. No actual audio recording. | `src/features/session-logging/components/elements/VoiceNoteElement.tsx` |
| 13 | Voice note: auto-stop at 3:00 with toast | MISSING | CRITICAL | No timer or 3-minute cap logic. | `src/features/session-logging/components/elements/VoiceNoteElement.tsx` |
| 14 | Voice note: microphone permission request on first use | MISSING | CRITICAL | No permission request code. | `src/features/session-logging/components/elements/VoiceNoteElement.tsx` |
| 15 | Voice note: permission-denied state with link to iOS Settings | MISSING | CRITICAL | No permission-denied UI. | `src/features/session-logging/components/elements/VoiceNoteElement.tsx` |
| 16 | Voice note: Re-record button with confirmation alert | MISSING | CRITICAL | Only Delete exists; no Re-record option. | `src/features/session-logging/components/elements/VoiceNoteElement.tsx` |
| 17 | Voice note: Delete with confirmation alert | MISSING | MEDIUM | Delete fires immediately with no alert. Spec: "Delete this recording?" | `src/features/session-logging/components/elements/VoiceNoteElement.tsx` (L44-48) |
| 18 | Voice note: animated waveform during recording | MISSING | MEDIUM | Just a text hint "Recording... Tap to stop" — no waveform animation. | `src/features/session-logging/components/elements/VoiceNoteElement.tsx` |
| 19 | Voice note: audio stored locally, uploaded to Supabase Storage on WiFi | MISSING | MEDIUM | No file storage or upload logic. | `src/features/session-logging/components/elements/VoiceNoteElement.tsx` |
| 20 | Single select: deselect by tapping the selected option | MISSING | MEDIUM | `select()` always sets — never checks if already selected to toggle off. Saved value should be `null` when deselected. | `src/features/session-logging/components/elements/SingleSelectElement.tsx` (L13-15) |
| 21 | Regular counter: Reset button with alert "Reset counter to zero?" | MISSING | MEDIUM | No reset button rendered. | `src/features/session-logging/components/elements/CounterElement.tsx` |
| 22 | Combined counter: Reset button with alert "Reset counter to zero?" | MISSING | MEDIUM | No reset button rendered. | `src/features/session-logging/components/elements/CombinedCounterElement.tsx` |
| 23 | Split counter: Independent reset per side with alert | MISSING | MEDIUM | No reset buttons on either side. | `src/features/session-logging/components/elements/SplitCounterElement.tsx` |
| 24 | Multistep counter: tap current chip to mark it done (chips are interactive) | PARTIAL | MEDIUM | Uses a "Next Step" / "Complete Rep" button instead of tapping the chip itself. Strict order is enforced but interaction model differs from spec. | `src/features/session-logging/components/elements/MultistepCounterElement.tsx` (L79-95) |
| 25 | Multistep counter: long-press rep counter clears current in-progress rep without changing rep count | MISSING | MEDIUM | No `onLongPress` handler. Has an "Undo" button that decrements reps instead — different behavior. | `src/features/session-logging/components/elements/MultistepCounterElement.tsx` (L42-46) |
| 26 | Multistep counter: Reset all with alert "Reset all progress to zero?" | PARTIAL | MEDIUM | Reset button only appears when `currentStep > 0` and only resets chip progress, not the rep count. No alert confirmation. | `src/features/session-logging/components/elements/MultistepCounterElement.tsx` (L96-104) |
| 27 | Countdown timer: plays default alert sound at 0 | MISSING | MEDIUM | No sound playback when timer finishes. Shows "Time's up!" text only. | `src/features/session-logging/components/elements/CountdownTimerElement.tsx` |
| 28 | Countdown timer: parent taps anywhere to silence | MISSING | MEDIUM | No sound to silence. | `src/features/session-logging/components/elements/CountdownTimerElement.tsx` |
| 29 | Lap timer: swipe-to-delete on each lap row | MISSING | MEDIUM | Lap rows are static `View`s with no swipe gesture. | `src/features/session-logging/components/elements/LapTimerElement.tsx` (L137-151) |
| 30 | Lap timer: reset shows alert "Reset timer and delete all laps?" | MISSING | MEDIUM | Reset fires immediately with no confirmation. | `src/features/session-logging/components/elements/LapTimerElement.tsx` (L76-81) |
| 31 | Interval timer: vibrates once and plays sound at each phase transition | MISSING | MEDIUM | No `Vibration` or audio API calls at phase transitions. | `src/features/session-logging/components/elements/IntervalTimerElement.tsx` (L65-96) |
| 32 | Interval timer: banner briefly shows new phase name at phase transition | MISSING | MEDIUM | No animated banner; only the badge text changes. | `src/features/session-logging/components/elements/IntervalTimerElement.tsx` |
| 33 | Interval timer: reset with alert "Reset interval timer?" | MISSING | MEDIUM | Reset fires immediately with no confirmation. | `src/features/session-logging/components/elements/IntervalTimerElement.tsx` (L131-139) |
| 34 | Multi-number input: swipe-to-delete on entries | MISSING | MEDIUM | Uses an "x" button per row instead of swipe gesture. | `src/features/session-logging/components/elements/MultiNumberInputElement.tsx` (L72-84) |
| 35 | Drill screen: active child name + activity name displayed as context | MISSING | MEDIUM | Only drill name is shown. No child/activity context. | `src/features/session-logging/screens/DrillScreen.tsx` (L69) |
| 36 | Reopening completed drill: updates existing drill result (not duplicate) | PARTIAL | MEDIUM | DrillScreen always creates a new `drillResultId` on Finish. Reopening a completed drill and finishing again creates a duplicate `drill_results` row. | `src/features/session-logging/screens/DrillScreen.tsx` (L50-51) |
| 37 | Stopwatch/Countdown/Lap/Interval: background-safe via persisted startTime | PARTIAL | MEDIUM | All element-level timers use in-memory `useRef` for startTime. On app kill, refs are lost and timer state is wrong on return. Session timer uses MMKV correctly, but element timers do not. | `StopwatchElement.tsx` (L26), `CountdownTimerElement.tsx` (L24), `LapTimerElement.tsx` (L23), `IntervalTimerElement.tsx` (L26-32) |
| 38 | Child switching blocked mid-session: alert "You have a session in progress. Finish it before switching children." | MISSING | MEDIUM | No blocking logic in this feature. | — |
| 39 | Session summary: uses stack push (card navigation) | PARTIAL | LOW | `session-summary` inherits `fullScreenModal` presentation from parent layout instead of `presentation: 'card'`. | `app/(modals)/_layout.tsx` (L8) |
| 40 | Loading state: skeleton with shimmer while drill list loads | MISSING | LOW | No skeleton/shimmer. FlatList shows nothing until data loads. | `src/features/session-logging/screens/SessionScreen.tsx` (L91-108) |
| 41 | Target indicator: green check in the corner of each element | PARTIAL | LOW | Elements change text/border color when target is met, but no dedicated corner-badge "green check" as spec describes. | All element files |
| 42 | Free text note: autosaves every few seconds | PARTIAL | LOW | Saves on every keystroke to React state, but not persisted to SQLite periodically. | `src/features/session-logging/components/elements/FreeTextNoteElement.tsx` |
| 43 | Emoji face scale: faces "from the builder" | PARTIAL | LOW | Hardcoded face sets (FACES_3, FACES_5). Spec says faces come from builder config, implying customization. | `src/features/session-logging/components/elements/EmojiFaceScaleElement.tsx` (L12-24) |
| 44 | Yes/No: selected button fills with accent color | PARTIAL | LOW | Uses `success-50`/`error-50` backgrounds, not the primary "accent color" the spec describes. Functionally correct but visual treatment differs. | `src/features/session-logging/components/elements/YesNoElement.tsx` (L63-76) |
| 45 | Interval timer: completion sound on final rest | MISSING | LOW | No audio plays when all cycles complete. | `src/features/session-logging/components/elements/IntervalTimerElement.tsx` (L77-88) |
| 46 | Mini player bar: confirmed rendering across all tabs | PARTIAL | LOW | Component exists and works, but placement in the tab layout was not verified in this audit (tab layout files not in scope). | `src/features/session-logging/components/MiniPlayerBar.tsx` |
| 47 | Session notes: saved when user taps "Done" on summary | PARTIAL | LOW | Note is saved when "Finish Session" is tapped (before summary appears), not on "Done." Functionally equivalent but timing differs. | `src/features/session-logging/screens/SessionScreen.tsx` (L55-57) |

### Passing items (no gaps)

| # | Spec requirement | Status | File(s) |
|---|---|--------|---------|
| 48 | Checklist: saved as `{ item_id: boolean }[]` | PASS | `ChecklistElement.tsx` |
| 49 | Regular counter: +/- by 1, minimum 0 | PASS | `CounterElement.tsx` |
| 50 | Combined counter: tap number opens numeric keypad | PASS | `CombinedCounterElement.tsx` |
| 51 | Split counter: two independent counters with builder labels | PASS | `SplitCounterElement.tsx` |
| 52 | Stopwatch: counts up, Start/Pause/Resume, no auto-stop | PASS | `StopwatchElement.tsx` |
| 53 | Stopwatch: reset without confirmation | PASS | `StopwatchElement.tsx` |
| 54 | Countdown: counts down, Start/Pause/Resume | PASS | `CountdownTimerElement.tsx` |
| 55 | Countdown: reset to configured value, paused, no confirmation | PASS | `CountdownTimerElement.tsx` |
| 56 | Lap timer: Lap records elapsed, numbered list below | PASS | `LapTimerElement.tsx` |
| 57 | Lap timer: Lap button active only while running | PASS | `LapTimerElement.tsx` |
| 58 | Interval timer: Work/Rest phases, cycle counter, Skip button, "Complete" | PASS | `IntervalTimerElement.tsx` |
| 59 | Checklist: toggle on/off, any order | PASS | `ChecklistElement.tsx` |
| 60 | Multi-select: toggle any combination | PASS | `MultiSelectElement.tsx` |
| 61 | Yes/No: select, switch, deselect (toggle off) | PASS | `YesNoElement.tsx` |
| 62 | Rating scale: select/deselect, shows min-to-max, optional labels | PASS | `RatingScaleElement.tsx` |
| 63 | Emoji face scale: 3 or 5 faces, select/deselect | PASS | `EmojiFaceScaleElement.tsx` |
| 64 | Number input: numeric, decimals, unit inline | PASS | `NumberInputElement.tsx` |
| 65 | Multi-number input: Add button, insertion order, remove entries | PASS | `MultiNumberInputElement.tsx` |
| 66 | Free text note: multiline, no character limit | PASS | `FreeTextNoteElement.tsx` |
| 67 | Drills can be logged in any order | PASS | `SessionScreen.tsx` |
| 68 | Completed drills visually distinguished | PASS | `DrillListItem.tsx` |
| 69 | "Finish Session" button always visible at bottom | PASS | `SessionScreen.tsx` |
| 70 | Minimize button collapses session, returns to previous screen | PASS | `SessionScreen.tsx` |
| 71 | Mini player bar: shows "[name] — in progress" + Resume | PASS | `MiniPlayerBar.tsx` |
| 72 | Session saved immediately when summary appears | PASS | `useFinishSessionMutation.ts` |
| 73 | Summary: shows duration | PASS | `SessionSummaryScreen.tsx` |
| 74 | Summary: shows accolades unlocked | PASS | `SessionSummaryScreen.tsx` |
| 75 | Summary: "Done" -> Home | PASS | `SessionSummaryScreen.tsx` |
| 76 | Finish Session with no drills: allowed | PASS | `SessionScreen.tsx` |
| 77 | Route files are thin wrappers | PASS | `app/(modals)/session/index.tsx`, `app/(modals)/session/[drillId].tsx`, `app/(modals)/session-summary.tsx` |
| 78 | All 18 element types have renderers | PASS | `ElementRenderer.tsx` |
| 79 | ElementRenderer exhaustive switch | PASS | `ElementRenderer.tsx` |

---

## 3. UX conventions compliance

- **Navigation model:** PARTIAL — Session opens as fullScreenModal (correct), drill pushes as card (correct), but session-summary inherits fullScreenModal instead of card push. Destructive confirmations (counter/timer resets) are supposed to use native iOS alerts but none are implemented.

- **Error states:** PARTIAL — DrillScreen shows an error toast on save failure ("Could not save drill. Please try again."). No other error handling visible. No inline validation, no network error handling per ux-conventions section 3.

- **Loading states:** FAIL — Spec and ux-conventions section 5 require skeleton with shimmer for list screens. No skeleton/shimmer loader exists. Drill list shows nothing while queries load.

- **Empty states:** FAIL — No empty state for the drill list (if an activity has no drills). No empty state text or icon per ux-conventions section 4.

- **Destructive confirmations:** FAIL — ux-conventions says "native iOS alerts for destructive confirmations." The spec defines alerts for every counter Reset, Lap timer Reset, Interval timer Reset, Voice Note Re-record, and Voice Note Delete. None of these use `Alert.alert()`.
