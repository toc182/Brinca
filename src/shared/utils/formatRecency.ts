const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function formatRecency(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'Never';

  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 'Never';

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.floor((startOfDay(now) - startOfDay(then)) / MS_PER_DAY);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
