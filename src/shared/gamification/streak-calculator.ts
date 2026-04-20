/**
 * Streak calculation per rewards-levels-accolades.md §6.
 * Consecutive calendar days with ≥1 completed session.
 * Derived from session history — never stored.
 */

export function calculateStreak(sessionDates: string[]): number {
  if (sessionDates.length === 0) return 0;

  // Deduplicate to calendar days and sort descending
  const uniqueDays = [...new Set(sessionDates.map((d) => d.split('T')[0]))].sort().reverse();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Streak must include today or yesterday to be current
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;

    if (Math.round(diffDays) === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
