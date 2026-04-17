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
Every write that must eventually reach Supabase: session records, drill results, element values, currency ledger entries, accolade unlocks, activity/drill configuration changes, child profile edits, measurement entries, reward changes. Account-level operations (email change, password change, account deletion, invite send) are **not** queued — they require a live connection and show a toast if offline per [`ux-conventions.md`](../ux-conventions.md).

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
On first login (after onboarding), the app pulls the user's full dataset from Supabase into SQLite. This is the only time a bulk Supabase read happens. Subsequent reads are local-only; new data from other family members arrives via a lightweight poll or Supabase Realtime subscription (implementation TBD in Phase 4).

### 7.2 Incoming changes from other family members
When a second family member (e.g. a therapist) logs a session on their device, that data reaches Supabase but is not automatically on the first user's device. Two options for V1 (decide during Phase 4):
- **Poll on foreground:** on each app foreground, pull new/updated rows since last sync timestamp.
- **Supabase Realtime:** subscribe to changes on the family's tables.

Either way, incoming data is written to SQLite first and the UI refreshes from SQLite — the same one-way flow.

---

## 8. What happens when

| Scenario | Behavior |
|---|---|
| App opened with no network | Full functionality. All reads from SQLite. All writes to SQLite + queue. |
| Network drops mid-session | Session continues. Auto-save writes to SQLite. Queue accumulates. |
| Network restored after hours offline | Sync engine drains the queue in order. User sees no interruption. |
| App killed mid-sync | `in_flight` operation has no confirmation → stays `in_flight`. On next launch, engine resets `in_flight` to `pending` and retries. |
| Device wiped / reinstalled | Local data lost. On login, initial data pull from Supabase restores everything that was synced. Unsynced data (queued but never pushed) is lost — this is the one data-loss scenario, and it requires both offline writes AND device wipe before the next sync. |
| Account deleted | Local SQLite, MMKV, and expo-secure-store are wiped. Supabase data deleted server-side per [`compliance/privacy-and-data.md`](../compliance/privacy-and-data.md). |

---

## 9. Open questions

- [ ] Exact poll interval for the sync engine while foregrounded (suggested: 30 seconds).
- [ ] Supabase Realtime vs poll for incoming changes from other family members — decide during Phase 4.
- [ ] Should the sync queue show a visible indicator somewhere in the UI (e.g. a small badge on the parent avatar showing "3 pending") or stay invisible? Current spec: invisible, with a toast only on persistent failure.
- [ ] Maximum queue size before warning the user — relevant if someone uses the app offline for weeks.
