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

const listeners = new Set<ToastListener>();

let currentState: ToastState = {
  message: '',
  variant: 'info',
  visible: false,
};

function notify() {
  listeners.forEach((listener) => listener({ ...currentState }));
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
  listeners.add(listener);
  return () => listeners.delete(listener);
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
