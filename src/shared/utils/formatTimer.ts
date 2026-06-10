/**
 * Formats a duration in seconds as MM:SS.mm (or H:MM:SS.mm for ≥ 1 hour),
 * where `mm` is centiseconds (00–99). Used by the stopwatch and lap timer
 * elements and their picker previews so a single change here propagates to
 * both surfaces.
 */
export function formatTimerWithCentiseconds(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = Math.floor(clamped % 60);
  const centiseconds = Math.floor((clamped * 100) % 100);

  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');
  const csStr = String(centiseconds).padStart(2, '0');

  const head = hours > 0 ? `${hours}:${minStr}:${secStr}` : `${minStr}:${secStr}`;
  return `${head}.${csStr}`;
}
