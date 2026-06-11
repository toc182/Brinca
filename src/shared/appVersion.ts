/**
 * Visible OTA version label.
 *
 * BUMP THIS on every `eas update` (v3 -> v4 -> ...) and pass the SAME value in the
 * update's --message, e.g. `eas update --branch production --message "v4"`.
 *
 * It is shown in the Home header so the user can confirm the new bundle actually
 * loaded (expo-updates applies an update on the launch AFTER it downloads, which
 * is otherwise invisible). Kept manual + predictable on purpose: the command and
 * the on-screen number can be cross-checked.
 */
export const APP_VERSION_LABEL = 'v15';
