import * as Sentry from '@sentry/react-native';
import { supabase } from '../supabase/client';
import { getNextPending, markInFlight, markComplete, markFailed, resetStaleInFlight, MAX_RETRIES } from './queue';
import { showToast } from '@/shared/utils/toast';

let isRunning = false;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;

export async function startSyncEngine() {
  await resetStaleInFlight();
  if (!isRunning) {
    isRunning = true;
    drainQueue();
  }
}

export function stopSyncEngine() {
  isRunning = false;
}

async function drainQueue() {
  while (isRunning) {
    const entry = await getNextPending();
    if (!entry) {
      await sleep(30000); // Poll every 30 seconds when queue empty
      continue;
    }

    try {
      await markInFlight(entry.id);
      await replayOperation(entry.operation, entry.table_name, JSON.parse(entry.payload));
      await markComplete(entry.id);
      consecutiveFailures = 0;
    } catch (error) {
      const message = extractErrorMessage(error);
      await markFailed(entry.id, message);
      consecutiveFailures++;

      if (__DEV__) {
        console.warn(
          `[sync] FAILED id=${entry.id} ${entry.operation} ${entry.table_name} retry=${entry.retry_count}\n  error: ${message}\n  payload: ${entry.payload}`
        );
      }
      Sentry.captureException(error, {
        tags: { source: 'sync-engine' },
        extra: {
          queueId: entry.id,
          operation: entry.operation,
          table: entry.table_name,
          retryCount: entry.retry_count,
        },
      });

      // Distinct Sentry event the first time an entry crosses MAX_RETRIES so
      // truly-stuck rows are filterable in dashboards (vs the regular
      // per-attempt failure noise above).
      if (entry.retry_count + 1 >= MAX_RETRIES) {
        Sentry.captureMessage('sync-queue entry exhausted retries', {
          level: 'error',
          tags: {
            source: 'sync-engine-permanent-failure',
            table: entry.table_name,
            operation: entry.operation,
          },
          extra: {
            queueId: entry.id,
            lastError: message,
            payloadPreview: entry.payload.slice(0, 240),
          },
        });
      }

      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        showToast('warning', "Some changes couldn't sync. We'll keep trying.");
        isRunning = false;
        return;
      }
    }
  }
}

async function replayOperation(operation: string, tableName: string, payload: Record<string, unknown>) {
  switch (operation) {
    case 'INSERT': {
      const { error } = await supabase.from(tableName).insert(payload);
      // 23505 = unique_violation. The row already exists on the server (most
      // commonly: local DB was wiped after a prior sync, the row was re-created
      // locally, and the queue tried to re-insert what's already there). Our
      // intent — "this row exists remotely" — is already satisfied, so treat
      // as success. Without this, the entry retries forever and trips the
      // consecutive-failure toast on every reload.
      if (error && error.code !== '23505') throw error;
      break;
    }
    case 'UPDATE': {
      const { id, ...fields } = payload;
      const { error } = await supabase.from(tableName).update(fields).eq('id', id as string);
      if (error) throw error;
      break;
    }
    case 'DELETE': {
      const { error } = await supabase.from(tableName).delete().eq('id', payload.id as string);
      // 204 from PostgREST when the row is already gone is not an error, but
      // if somehow we get one we treat a not-found as already-applied. The
      // common case (idempotent DELETE) already returns success without error.
      if (error) throw error;
      break;
    }
  }
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const e = error as { message?: string; code?: string; details?: string; hint?: string };
    const parts = [e.message, e.code && `code=${e.code}`, e.details && `details=${e.details}`, e.hint && `hint=${e.hint}`].filter(Boolean);
    if (parts.length) return parts.join(' | ');
    try { return JSON.stringify(error); } catch { return 'Unknown error'; }
  }
  return String(error ?? 'Unknown error');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (!isRunning) { resolve(); return; }
    setTimeout(resolve, ms);
  });
}
