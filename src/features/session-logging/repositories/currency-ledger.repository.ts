import { getDatabase } from '@/lib/sqlite/db';
import { appendToQueue } from '@/lib/sync/queue';
import type { UUID, CurrencySource } from '@/types/domain.types';

export async function appendLedgerEntry(
  id: UUID,
  childId: UUID,
  amount: number,
  source: CurrencySource,
  referenceId: UUID | null,
  reason: string | null
) {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO currency_ledger (id, child_id, amount, source, reference_id, reason) VALUES (?, ?, ?, ?, ?, ?)`,
    id, childId, amount, source, referenceId, reason
  );
  await appendToQueue('INSERT', 'currency_ledger', {
    id,
    child_id: childId,
    amount,
    source,
    reference_id: referenceId,
    reason,
  });
}

export async function getBalance(childId: UUID): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM currency_ledger WHERE child_id = ?`, childId
  );
  return result?.total ?? 0;
}

export async function getPositiveTotal(childId: UUID): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM currency_ledger WHERE child_id = ? AND amount > 0`, childId
  );
  return result?.total ?? 0;
}

export type SessionBonus = {
  id: string;
  amount: number;
  reason: string | null;
};

export async function getBonusesBySession(sessionId: UUID): Promise<SessionBonus[]> {
  const db = await getDatabase();
  return db.getAllAsync<SessionBonus>(
    `SELECT id, amount, reason FROM currency_ledger
     WHERE source = 'manual_bonus' AND reference_id = ?
     ORDER BY created_at ASC`,
    sessionId
  );
}
