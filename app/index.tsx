import { StyleSheet, View } from 'react-native';

import { colors } from '@/shared/theme';

/**
 * Neutral launch entry — owns the root URL "/".
 *
 * Route groups like (settings) are transparent in the URL, so before this file
 * existed app/(settings)/index.tsx was the ONLY route matching "/", which made
 * the Settings modal the first screen on every cold launch (the "settings
 * flash"). This blank, splash-coloured screen claims "/" instead; RootLayout's
 * auth effect immediately redirects to /(tabs)/home or /(auth)/login, so it is
 * only ever present (behind the native splash) for the instant before that runs.
 */
export default function Index() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
