import { StyleSheet, Text } from 'react-native';
import { colors, typography, spacing } from '@/shared/theme';

export function NoConfig({ label }: { label: string }) {
  return <Text style={styles.text}>{label}</Text>;
}

const styles = StyleSheet.create({
  text: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
});
