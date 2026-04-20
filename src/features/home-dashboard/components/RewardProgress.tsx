import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '@/shared/theme';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { Button } from '@/shared/components/Button';

interface RewardProgressProps {
  reward: { name: string; cost: number } | null;
  balance: number;
  onAddReward?: () => void;
}

export function RewardProgress({ reward, balance, onAddReward }: RewardProgressProps) {
  if (!reward) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No rewards set</Text>
        {onAddReward && <Button title="Add reward" onPress={onAddReward} variant="text" size="small" />}
      </View>
    );
  }

  const progress = Math.min(1, balance / reward.cost);
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{reward.name}</Text>
      <ProgressBar progress={progress} variant="kid" />
      <Text style={styles.detail}>{balance} / {reward.cost}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xxs },
  name: { ...typography.titleSmall, color: colors.textPrimary },
  detail: { ...typography.caption, color: colors.textSecondary },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});
