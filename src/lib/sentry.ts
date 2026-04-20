import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) console.log('[Sentry] No DSN configured, skipping init');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,

    // Privacy: never send PII by default (privacy-and-data.md §6.1)
    sendDefaultPii: false,

    // Scrub session notes from breadcrumbs to prevent child PII in crash reports
    beforeBreadcrumb(breadcrumb) {
      // Drop text input breadcrumbs that may contain session notes
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
