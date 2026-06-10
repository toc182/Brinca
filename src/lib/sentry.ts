import * as Sentry from '@sentry/react-native';

const SENTRY_DSN =
  process.env.EXPO_PUBLIC_SENTRY_DSN ??
  'https://c1b5bd34c56cc08f89eebd3c02cd7318@o4511140030251008.ingest.us.sentry.io/4511254380675072';

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) console.log('[Sentry] No DSN configured, skipping init');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,

    // Privacy: never send PII (privacy-and-data.md §6.1)
    sendDefaultPii: false,

    enableLogs: true,

    // Session Replay only in production — disabled in dev because the
    // native SDK flags Metro/dev as an unreliable environment and bails out
    replaysSessionSampleRate: __DEV__ ? 0 : 0.1,
    replaysOnErrorSampleRate: __DEV__ ? 0 : 1,
    integrations: __DEV__
      ? [Sentry.feedbackIntegration()]
      : [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

    // Scrub session notes from breadcrumbs to prevent child PII in crash reports
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'ui.input' || breadcrumb.category === 'ui.text') {
        return null;
      }
      return breadcrumb;
    },
  });
}

/**
 * Set the authenticated user for Sentry.
 * Only use the parent's app user ID — NEVER pass child identifiers.
 */
export function setSentryUser(userId: string) {
  Sentry.setUser({ id: userId });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}
