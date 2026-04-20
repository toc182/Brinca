import { getDatabase } from '@/lib/sqlite/db';
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
