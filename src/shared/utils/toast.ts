/**
 * Toast manager — imperative API for showing toasts.
 * Components subscribe to state changes to render the Toast component.
 *
 * Usage:
 *   showToast('success', 'Session saved');
 *   showStandardToast('success', 'sessionSaved');
 */

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  message: string;
  variant: ToastVariant;
  visible: boolean;
}

type ToastListener = (state: ToastState) => void;

// Ordered stack of mounted listeners. Multiple GlobalToast instances exist
// (one per modal navigator — see app/(settings)/_layout.tsx); only the
// topmost (last-subscribed) gets the live `visible: true` state. Earlier
// listeners receive `visible: false` so they collapse out of the way and
// the user only sees one toast — the one in the frontmost layer.
const listeners: ToastListener[] = [];

let currentState: ToastState = {
  message: '',
  variant: 'info',
  visible: false,
};

function notify() {
  const topIdx = listeners.length - 1;
  for (let i = 0; i < listeners.length; i++) {
    listeners[i]({
      ...currentState,
      visible: i === topIdx ? currentState.visible : false,
    });
  }
}

export function showToast(variant: ToastVariant, message: string): void {
  currentState = { message, variant, visible: true };
  notify();
}

export function dismissToast(): void {
  currentState = { ...currentState, visible: false };
  notify();
}

export function subscribeToast(listener: ToastListener): () => void {
  listeners.push(listener);
  notify();
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx < 0) return;
    const wasTop = idx === listeners.length - 1;
    listeners.splice(idx, 1);
    // If the topmost layer (the one that owned a visible toast) is going
    // away, dismiss the toast globally instead of handing it off to the
    // next layer down. Toasts belong to the context they were fired in.
    if (wasTop && currentState.visible) {
      currentState = { ...currentState, visible: false };
    }
    notify();
  };
}

export function getToastState(): ToastState {
  return { ...currentState };
}

// Standard messages keyed by name — used with showStandardToast.
const standardMessages = {
  sessionSaved: 'Session saved',
  changesSaved: 'Changes saved',
  profileCreated: 'Profile ready!',
  activityCreated: 'Activity created',
  inviteSent: 'Invite sent',
  goalUpdated: 'Goal updated',
  networkUnavailable: "You're offline. We'll sync when you're back.",
  syncFailed: "Couldn't sync. Tap to retry.",
  saveFailed: "Couldn't save. Check your connection.",
  genericError: 'Something broke on our end. Try again.',
} as const;

export type StandardMessageKey = keyof typeof standardMessages;

export function showStandardToast(variant: ToastVariant, key: StandardMessageKey): void {
  showToast(variant, standardMessages[key]);
}
