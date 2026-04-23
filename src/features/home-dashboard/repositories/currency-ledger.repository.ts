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