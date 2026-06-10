/**
 * Reject a promise if it doesn't settle within `ms`.
 *
 * Used to bound launch-critical awaits (DB open, session read, auth network
 * calls). The Supabase client has no request timeout, so on a half-open /
 * black-holed network a request can hang forever instead of rejecting — which
 * froze the app on a blank/splash screen at startup. Wrapping those awaits here
 * guarantees they always settle, so startup can never stall indefinitely.
 *
 * The timer is always cleared (success or failure) so it can neither leak nor
 * fire late.
 */
export class LaunchTimeoutError extends Error {
  readonly label: string;
  readonly ms: number;

  constructor(label: string, ms: number) {
    super(`Timed out: ${label} after ${ms}ms`);
    this.name = 'LaunchTimeoutError';
    this.label = label;
    this.ms = ms;
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new LaunchTimeoutError(label, ms)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
