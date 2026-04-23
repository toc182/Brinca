import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '@/shared/theme';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { Button } from '@/shared/components/Button';
import { useUIPreferencesStore } from '@/stores/ui-preferences.store';

interface RewardProgressProps {
  reward: { name: string; cost: number } | null;
  balance: number;
  onAddReward?: () => void;
}

export function RewardProgress({ reward, balance, onAddReward }: RewardProgressProps) {
  const currencyName = useUIPreferencesStore((s) => s.currencyName);

  if (!reward) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No reward set. Add a reward to motivate practice.</Text>
        {onAddReward && (
          <Button title="Add reward" onPress={onAddReward} variant="text" size="small" />
        )}
      </View>
    );
  }

  const progress = Math.min(1, balance / reward.cost);

  return (
    <View style={styles.pressable}>
      <Text style={styles.name}>{reward.name}</Text>
      <ProgressBar progress={progress} variant="kid" />
      <Text style={styles.detail}>
        {balance} of {reward.cost} {currencyName} — {reward.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xxs },
  pressable: { gap: spacing.xxs },
  pressed: { opacity: 0.7 },
  name: { ...typography.titleSmall, color: colors.textPrimary },
  detail: { ...typography.caption, color: colors.textSecondary },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});
