/**
 * Tier reward evaluation per rewards-levels-accolades.md §3.
 * Highest qualifying tier wins. Conditions with missing elements are skipped.
 * Deterministic tiebreaker via display_order.
 */

import { randomUUID } from 'expo-crypto';
import { getDatabase } from '@/lib/sqlite/db';
import { appendLedgerEntry } from '../repositories/currency-ledger.repository';
import type { UUID } from '@/types/domain.types';

interface TierResult {
  tierName: string;
  currencyAmount: number;
  source: 'drill_tier' | 'session_tier';
  referenceId: UUID;
}

export async function evaluateTiers(sessionId: UUID, childId: UUID): Promise<TierResult[]> {
  const db = await getDatabase();
  const results: TierResult[] = [];

  // Get all drill results for this session
  const drillResults = await db.getAllAsync<{
    id: string;
    drill_id: string;
  }>(`SELECT id, drill_id FROM drill_results WHERE session_id = ? AND is_complete = 1`, sessionId);

  // Evaluate drill-level tiers
  for (const dr of drillResults) {
    const tier = await evaluateBestTier(db, 'drill', dr.drill_id, dr.id);
    if (tier) {
      const ledgerId = randomUUID();
      await appendLedgerEntry(ledgerId, childId, tier.currencyAmount, 'drill_tier', dr.id, tier.tierName);
      results.push({ ...tier, source: 'drill_tier', referenceId: dr.id });
    }
  }

  // Evaluate session-level tiers (parent_type = 'activity')
  const session = await db.getFirstAsync<{ activity_id: string }>(
    `SELECT activity_id FROM sessions WHERE id = ?`, sessionId
  );
  if (session) {
    const tier = await evaluateBestTier(db, 'activity', session.activity_id, sessionId);
    if (tier) {
      const ledgerId = randomUUID();
      await appendLedgerEntry(ledgerId, childId, tier.currencyAmount, 'session_tier', sessionId, tier.tierName);
      results.push({ ...tier, source: 'session_tier', referenceId: sessionId });
    }
  }

  return results;
}

async function evaluateBestTier(
  db: Awaited<ReturnType<typeof getDatabase>>,
  parentType: string,
  parentId: string,
  contextId: string
): Promise<{ tierName: string; currencyAmount: number } | null> {
  const tiers = await db.getAllAsync<{
    id: string;
    name: string;
    conditions: string;
    currency_amount: number;
    display_order: number;
  }>(
    `SELECT * FROM tier_rewards WHERE parent_type = ? AND parent_id = ? ORDER BY currency_amount DESC, display_order ASC`,
    parentType, parentId
  );

  for (const tier of tiers) {
    const conditions = JSON.parse(tier.conditions) as { trackingElementId: string; operator: string; value: number }[];
    if (conditions.length === 0) {
      return { tierName: tier.name, currencyAmount: tier.currency_amount };
    }

    const qualifies = await checkConditions(db, conditions, contextId, parentType);
    if (qualifies) {
      return { tierName: tier.name, currencyAmount: tier.currency_amount };
    }
  }

  return null;
}

async function checkConditions(
  db: Awaited<ReturnType<typeof getDatabase>>,
  conditions: { trackingElementId: string; operator: string; value: number }[],
  contextId: string,
  parentType: string
): Promise<boolean> {
  let validConditions = 0;
  let passedConditions = 0;

  for (const cond of conditions) {
    // Check if element exists and is active
    const element = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM tracking_elements WHERE id = ?`, cond.trackingElementId
    );
    if (!element) continue; // Skip missing elements per §3.2

    validConditions++;

    // Get the element value from the relevant drill result
    let valueRow: { value: string } | null = null;
    if (parentType === 'drill') {
      valueRow = await db.getFirstAsync<{ value: string }>(
        `SELECT ev.value FROM element_values ev
         JOIN drill_results dr ON dr.id = ev.drill_result_id
         WHERE dr.id = ? AND ev.tracking_element_id = ?`,
        contextId, cond.trackingElementId
      );
    } else {
      // Session-level: check across all drill results in the session
      valueRow = await db.getFirstAsync<{ value: string }>(
        `SELECT ev.value FROM element_values ev
         JOIN drill_results dr ON dr.id = ev.drill_result_id
         WHERE dr.session_id = ? AND ev.tracking_element_id = ?`,
        contextId, cond.trackingElementId
      );
    }

    if (!valueRow) continue;

    const parsed = JSON.parse(valueRow.value);
    const numericValue = extractNumericValue(parsed);
    if (numericValue === null) continue;

    const passed = compareValues(numericValue, cond.operator, cond.value);
    if (passed) passedConditions++;
  }

  // If all valid conditions reference missing elements, skip entirely
  if (validConditions === 0) return false;

  // AND logic: all valid conditions must pass
  return passedConditions === validConditions;
}

function extractNumericValue(value: Record<string, unknown>): number | null {
  if ('count' in value && typeof value.count === 'number') return value.count;
  if ('reps' in value && typeof value.reps === 'number') return value.reps;
  if ('elapsed_seconds' in value && typeof value.elapsed_seconds === 'number') return value.elapsed_seconds;
  if ('value' in value && typeof value.value === 'number') return value.value;
  if ('left' in value && 'right' in value) return (value.left as number) + (value.right as number);
  if ('completed_cycles' in value && typeof value.completed_cycles === 'number') return value.completed_cycles;
  if ('items' in value && Array.isArray(value.items)) return (value.items as { checked: boolean }[]).filter((i) => i.checked).length;
  if ('selected' in value && Array.isArray(value.selected)) return value.selected.length;
  if ('values' in value && Array.isArray(value.values)) return value.values.length;
  if ('laps' in value && Array.isArray(value.laps)) return value.laps.length;
  return null;
}

function compareValues(actual: number, operator: string, target: number): boolean {
  switch (operator) {
    case '>=': return actual >= target;
    case '<=': return actual <= target;
    case '=': return actual === target;
    default: return false;
  }
}
