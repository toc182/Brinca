/**
 * Level thresholds per rewards-levels-accolades.md §5.2.
 * Levels based on total sessions completed. No ceiling.
 */

const THRESHOLDS = [0, 3, 8, 15, 25, 40, 60, 80, 100, 120];

export function getLevel(sessionCount: number): number {
  // L11+ = +20 per level from 120
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (sessionCount >= THRESHOLDS[i]) {
      if (i === THRESHOLDS.length - 1 && sessionCount >= THRESHOLDS[i]) {
        // Beyond L10, each additional 20 sessions = +1 level
        const extra = Math.floor((sessionCount - THRESHOLDS[i]) / 20);
        return i + 1 + extra;
      }
      return i + 1;
    }
  }
  return 1;
}

export function getThresholdForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= THRESHOLDS.length) return THRESHOLDS[level - 1];
  // L11+: 120 + (level - 10) * 20
  return 120 + (level - 10) * 20;
}

export function getLevelProgress(sessionCount: number): { level: number; progress: number; sessionsToNext: number } {
  const level = getLevel(sessionCount);
  const currentThreshold = getThresholdForLevel(level);
  const nextThreshold = getThresholdForLevel(level + 1);
  const range = nextThreshold - currentThreshold;
  const completed = sessionCount - currentThreshold;
  return {
    level,
    progress: range > 0 ? completed / range : 0,
    sessionsToNext: nextThreshold - sessionCount,
  };
}
