import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '@/shared/theme';
import { useSessionTimer } from '../hooks/useSessionTimer';

export function SessionTimer() {
  const { formatted } = useSessionTimer();
  return <Text style={styles.timer}>{formatted}</Text>;
}

const styles = StyleSheet.create({
  timer: { ...typography.timer, color: colors.textPrimary },
});
