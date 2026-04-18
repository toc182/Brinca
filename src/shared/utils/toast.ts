import { Alert } from 'react-native';

/**
 * Minimal toast utility — v0 using Alert.alert as a placeholder.
 * Will be replaced with a proper Toast component in Phase 2.
 */

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

const standardMessages = {
  // Success
  sessionSaved: 'Session saved.',
  changesSaved: 'Changes saved.',
  childProfileCreated: 'Profile created.',
  activityCreated: 'Activity created.',

  // Errors
  networkUnavailable: "You're offline. Changes will sync when your connection is restored.",
  syncFailed: "Couldn't sync. We'll try again shortly.",
  genericError: 'Something went wrong. Please try again.',
  failedToSave: "Couldn't save. Please try again.",

  // Validation
  fieldRequired: 'This field is required.',
  nameTooLong: 'Name must be under 50 characters.',
} as const;

export type StandardMessageKey = keyof typeof standardMessages;

export function showToast(_variant: ToastVariant, message: string): void {
  // Phase 2 will replace this with a proper animated toast component.
  // For now, use a simple console log in dev and Alert for errors.
  if (__DEV__) {
    console.log(`[Toast/${_variant}] ${message}`);
  }
}

export function showStandardToast(variant: ToastVariant, key: StandardMessageKey): void {
  showToast(variant, standardMessages[key]);
}

export { standardMessages };
