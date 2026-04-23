import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Offline banner. Only renders when the device is offline.
 *
 * Place at the top of a screen's content area (below the header).
 *
 * Per UX conventions §3: "You're offline. Changes will sync when your
 * connection is restored."
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        You're offline. Changes will sync when your connection is restored.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 44,
    backgroundColor: colors.warning500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  text: {
    ...typography.caption,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
});
