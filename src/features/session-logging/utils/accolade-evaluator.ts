/**
 * Accolade evaluation per rewards-levels-accolades.md §7.
 * Evaluated at Finish Session. Once unlocked, never revoked.
 */

import type { UUID } from '@/types/domain.types';
import { ACCOLADE_CATALOG } from '@/shared/gamification/accolade-catalog';
import { getLevel } from '@/shared/gamification/level-thresholds';
import { calculateStreak } from '@/shared/gamification/streak-calculator';
import { getCompletedSessionCount, getCompletedSessionDates } from '../repositories/session.repository';
import { getCompletedDrillCount } from '../repositories/drill-result.repository';
import { getBalance, getPositiveTotal } from '../repositories/currency-ledger.repository';
import { getUnlockedAccolades, insertAccoladeUnlock } from '../repositories/accolade.repository';
import { getDatabase } from '@/lib/sqlite/db';

export async function evaluateAccolades(childId: UUID): Promise<string[]> {
  const unlocked = await getUnlockedAccolades(childId);
  const unlockedIds = new Set(unlocked.map((a) => a.accolade_id));
  const newlyUnlocked: string[] = [];

  // Gather stats
  const sessionCount = await getCompletedSessionCount(childId);
  const drillCount = await getCompletedDrillCount(childId);
  const sessionDates = await getCompletedSessionDates(childId);
  const streak = calculateStreak(sessionDates);
  const level = getLevel(sessionCount);
  const balance = await getBalance(childId);
  const positiveTotal = await getPositiveTotal(childId);

  // Check reward count
  const db = await getDatabase();
  const rewardCount = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM rewards WHERE child_id = ?`, childId
  );

  // Week sessions (current calendar week)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  const weekSessions = sessionDates.filter((d) => new Date(d) >= startOfWeek).length;

  // Last session duration
  const lastSession = await db.getFirstAsync<{ duration_seconds: number | null }>(
    `SELECT duration_seconds FROM sessions WHERE child_id = ? AND is_complete = 1 ORDER BY ended_at DESC LIMIT 1`, childId
  );
  const lastDurationMinutes = (lastSession?.duration_seconds ?? 0) / 60;

  const rules: Record<string, () => boolean> = {
    first_steps: () => sessionCount >= 1,
    coin_catcher: () => positiveTotal > 0,
    drill_starter: () => drillCount >= 1,
    goal_setter: () => (rewardCount?.count ?? 0) >= 1,
    // big_win evaluated separately at redemption
    warm_up: () => sessionCount >= 2,
    on_a_roll: () => streak >= 5,
    week_warrior: () => weekSessions >= 5,
    deep_focus: () => lastDurationMinutes >= 30,
    double_digits: () => sessionCount >= 10,
    drill_master: () => drillCount >= 100,
    level_up: () => level >= 5,
    unstoppable: () => streak >= 30,
    iron_streak: () => streak >= 100,
    half_a_thousand: () => drillCount >= 500,
    century_club: () => sessionCount >= 100,
    treasure_hunter: () => positiveTotal >= 10000,
  };

  for (const accolade of ACCOLADE_CATALOG) {
    if (unlockedIds.has(accolade.id)) continue;
    if (accolade.id === 'big_win') continue; // Evaluated at redemption only

    const rule = rules[accolade.id];
    if (rule && rule()) {
      await insertAccoladeUnlock(childId, accolade.id);
      newlyUnlocked.push(accolade.id);
    }
  }

  return newlyUnlocked;
}
