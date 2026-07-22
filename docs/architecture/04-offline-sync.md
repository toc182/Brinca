# Offline-First Sync Strategy — Brinca

> How data flows between the local device and Supabase. This is an architectural decision record, not a feature spec.

**Date:** April 15, 2026
**Author:** Rewritten from `agent_docs/offline_sync.md`
**Status:** Committed
**Related docs:** [`02-project-structure.md`](02-project-structure.md), [`../research/01-stack-decision.md`](../research/01-stack-decision.md)

---

## 1. Core principle

**expo-sqlite is the source of truth on the device. Supabase is the source of truth in the cloud.** The app always writes to SQLite first, the UI always reads from SQLite, and a background process syncs changes to Supabase when a network connection is available. The user never waits for the network.

---

## 2. Write flow

Every write operation follows this path:

1. **Feature mutation** (e.g. `useFinishSessionMutation`) writes to the feature's SQLite repository.
2. The same mutation appends a **sync operation** to the outbound queue (`src/lib/sync/queue.ts`).
3. The UI updates immediately from SQLite — no loading spinner, no network check.
4. The **sync engine** (`src/lib/sync/engine.ts`) picks up queued operations in the background and replays them against Supabase.

No feature mutation ever calls Supabase directly. Per [`02-project-structure.md`](02-project-structure.md) Convention 7, bypassing the queue creates data-loss scenarios on intermittent connections.

---

## 3. Sync queue

### 3.1 Storage
The queue is a SQLite table on the same database as the app's data. Suggested columns:

- `id` — auto-incrementing primary key (determines replay order)
- `operation` — the Supabase operation type: `INSERT`, `UPDATE`, `DELETE`
- `table_name` — the Supabase table to target
- `payload` — JSON blob containing the row data
- `created_at` — timestamp the operation was queued
- `status` — `pending | in_flight | failed`
- `retry_count` — number of failed attempts
- `last_error` — last error message (nullable)

### 3.2 What goes in the queue
Every write that must eventually reach Supabase: session records, drill results, element values, currency ledger entries, accolade unlocks, activity/drill configuration changes, child profile edits, measurement entries, reward changes. Account-level operations (email change, password change, account deletion, invite send) are **not** queued — they require a live connection and show a toast if offline per [`docs/design-system/components/toast.md`](../design-system/components/toast.md) and [`docs/brand/microcopy.md`](../brand/microcopy.md).

### 3.3 Ordering
Operations are replayed in insertion order (`id` ascending). This preserves foreign-key dependencies — a session row is inserted before its drill-result rows because the mutation appended them in that order.

---

## 4. Sync engine

### 4.1 When it runs
- On app foreground when a network connection is detected.
- On network status change (offline → online).
- Periodically while the app is in the foreground (poll interval TBD — suggested 30 seconds).
- Not while the app is backgrounded (iOS background execution limits make this unreliable; sync resumes on next foreground).

### 4.2 How it processes
1. Select the oldest `pending` operation from the queue.
2. Mark it `in_flight`.
3. Execute the Supabase call.
4. On success: delete the row from the queue.
5. On failure: increment `retry_count`, store `last_error`, set status back to `failed`.
6. Move to the next operation.

Operations are processed **one at a time, sequentially**. Parallel execution risks out-of-order foreign-key violations.

### 4.3 Retry policy
- Failed operations are retried on the next engine cycle.
- After 5 consecutive failures on the same operation, the engine pauses and shows a persistent toast: "Some changes couldn't sync. We'll keep trying."
- The engine resumes retrying on the next network-status change or app foreground.
- No operation is ever dropped from the queue automatically — manual resolution (or account deletion) is the only way to clear a permanently stuck operation.

---

## 5. Conflict resolution

**Last-write-wins using `updated_at` timestamps.** When the sync engine pushes a row to Supabase, the Supabase `updated_at` column is compared. If the server's `updated_at` is newer than the queued operation's, the server version wins and the queued operation is discarded.

This is a deliberate V1 choice. Per [`product-vision.md`](../product-vision.md), the same drill result is never edited simultaneously by two users — the use cases involve one parent logging a session at a time. A more sophisticated merge strategy (field-level conflict resolution, CRDTs) is deferred to V2 if real conflicts are observed in production.

### 5.1 Edge case: two family members log sessions for the same child simultaneously
Each session is a separate row with a unique ID generated client-side. No conflict — both sessions sync independently. Conflict only arises if two users edit the **same** row (e.g. both edit a child's name at the same time), which last-write-wins handles acceptably for V1.

---

## 6. Media sync

Photos and voice recordings follow a separate path from structured data:

1. File is saved locally (camera roll or app sandbox) and the **local file URI** is stored in SQLite.
2. The UI displays the local file immediately.
3. A background media uploader (separate from the sync queue) uploads the file to **Supabase Storage on WiFi only** — per [`01-stack-decision.md`](../research/01-stack-decision.md).
4. Images are compressed to ~800px width before upload.
5. On successful upload, the SQLite record is updated with the Supabase Storage URL.
6. The next sync-engine cycle pushes the updated URL to Supabase.

If upload fails, the local file persists and upload retries on the next WiFi connection. The user never sees an error for media upload during a session — per [`feature-specs/session-logging.md`](../feature-specs/session-logging.md), photos that fail to upload are saved locally and uploaded automatically when the connection is restored.

---

## 7. Read flow

Reads always come from SQLite. TanStack Query hooks read from feature repositories, which query SQLite. The query cache is populated from local data, not from Supabase. Supabase is never queried directly for display purposes.

### 7.1 Initial data pull
On first login (after onboarding), the app pulls the user's full dataset from Supabase into SQLite. This is the first run of the delta pull (§7.2) with an empty watermark — there is no longer a separate "bootstrap only" read path. `rehydrateChildData` still runs first on the launch/switch paths as a proven foreign-key-safe bootstrap (INSERT OR IGNORE), then the pull reconciles authoritatively.

### 7.2 Incoming changes from other devices (implemented)
Sync is **two-way**. The push half (`sync/engine.ts`) drains the outgoing queue to Supabase; the pull half (`sync/pull.ts`) downloads changes made on other devices. Without the pull, two devices on one account drift apart permanently and deletions made on one silently reappear on the other.

**How the pull works** (`pullChildData`):
- **Delta by watermark.** Each table stores the newest `updated_at` it has already seen in the local `sync_state` table. The pull asks Supabase for rows strictly newer than that watermark, parent tables first so foreign keys resolve, and advances the watermark to the newest row seen. A null watermark (fresh install, or first launch after this feature shipped) means a full download.
- **Deletions propagate as tombstones.** Every user-deletable table carries `deleted_at`. Deleting stamps it instead of removing the row (a hard DELETE leaves nothing for the other device to observe, so the row reappears). List queries filter `deleted_at IS NULL`; the pull writes the tombstone so the other device hides the row too.
- **Local unsent changes win.** A row whose id is in the outgoing queue is not overwritten by the server copy — the user's own not-yet-pushed edit is protected. After it pushes, the server `updated_at` bumps past the watermark and the reconciled row pulls normally.
- **Never mid-session.** The pull is skipped while a session is `active` / `paused` / `minimized`, so live logging is never overwritten.

**When it runs:** on login, on child switch, on every app foreground, and on a 60-second interval while foregrounded. All fire-and-forget (never throws).

**Conflict resolution:** last-writer-wins by `updated_at`, except the local-unsent guard above.

**Known limitation:** if the *same row* is edited on two devices while both are offline, the later push wins and the earlier edit is lost (no field-level merge). Acceptable for a two-parent / one-therapist household; revisit if simultaneous offline editing of the same record becomes common.

---

## 8. What happens when

| Scenario | Behavior |
|---|---|
| App opened with no network | Full functionality. All reads from SQLite. All writes to SQLite + queue. |
| Network drops mid-session | Session continues. Auto-save writes to SQLite. Queue accumulates. |
| Network restored after hours offline | Sync engine drains the queue in order. User sees no interruption. |
| App killed mid-sync | `in_flight` operation has no confirmation → stays `in_flight`. On next launch, engine resets `in_flight` to `pending` and retries. |
| Device wiped / reinstalled | Local data lost. On login, the delta pull (empty watermark) restores everything that was synced. Unsynced data (queued but never pushed) is lost — this is the one data-loss scenario, and it requires both offline writes AND device wipe before the next sync. |
| Same account on a second device | Both devices converge: each pushes its own changes and pulls the other's on foreground / 60s interval. Edits and deletions propagate both ways. |
| Same row edited offline on two devices | Later push wins; earlier edit lost (no field-level merge). See §7.2 known limitation. |
| Account deleted | Local SQLite, MMKV, and expo-secure-store are wiped. Supabase data deleted server-side per [`compliance/privacy-and-data.md`](../compliance/privacy-and-data.md). |

---

## 9. Open questions

- [x] ~~Exact poll interval for the sync engine while foregrounded~~ — pull runs on foreground + a 60s foreground interval (`app/_layout.tsx`).
- [x] ~~Supabase Realtime vs poll for incoming changes~~ — chose foreground + interval poll (delta by watermark). Realtime can layer on later if near-instant propagation is needed.
- [ ] Should the sync queue show a visible indicator somewhere in the UI (e.g. a small badge on the parent avatar showing "3 pending") or stay invisible? Current spec: invisible, with a toast only on persistent failure.
- [ ] Maximum queue size before warning the user — relevant if someone uses the app offline for weeks.
- [ ] Field-level merge for the same-row-offline-on-two-devices case (currently last-writer-wins; see §7.2).
