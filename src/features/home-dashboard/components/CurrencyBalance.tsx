import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/shared/theme';
import { useUIPreferencesStore } from '@/stores/ui-preferences.store';

export function CurrencyBalance({ balance }: { balance: number }) {
  const currencyName = useUIPreferencesStore((s) => s.currencyName);
  return (
    <View style={styles.container}>
      <Text style={styles.amount}>{balance}</Text>
      <Text style={styles.label}>{currencyName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.xxs },
  amount: { fontFamily: 'Fredoka_600SemiBold', fontSize: 36, color: colors.primary500 },
  label: { fontFamily: 'Lexend_500Medium', fontSize: 14, color: colors.textSecondary },
});
