import { supabase } from '../supabase/client';
import { getNextPending, markInFlight, markComplete, markFailed, resetStaleInFlight } from './queue';
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
      const message = error instanceof Error ? error.message : 'Unknown error';
      await markFailed(entry.id, message);
      consecutiveFailures++;

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
      if (error) throw error;
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
      if (error) throw error;
      break;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    if (!isRunning) { resolve(); return; }
    setTimeout(resolve, ms);
  });
}
