import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '@/shared/theme';

interface TierResult {
  tierName: string;
  currencyAmount: number;
  source: string;
}

export function RewardBreakdown({ tiers }: { tiers: TierResult[] }) {
  if (tiers.length === 0) return null;

  return (
    <View style={styles.container}>
      {tiers.map((tier, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.name}>{tier.tierName}</Text>
          <Text style={styles.amount}>+{tier.currencyAmount}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginTop: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xxs },
  name: { ...typography.bodySmall, color: colors.textSecondary },
  amount: { ...typography.bodySmall, color: colors.primary500, fontFamily: 'Lexend_600SemiBold' },
});
