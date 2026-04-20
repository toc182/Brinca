import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { colors, typography, spacing } from '@/shared/theme';

interface MeasurementsSummaryProps {
  latestWeight: { value: number; date: string } | null;
  latestHeight: { value: number; date: string } | null;
  measurementUnit: 'metric' | 'imperial';
}

function formatWeight(value: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') {
    const lbs = (value * 2.20462).toFixed(1);
    return `${lbs} lbs`;
  }
  return `${value.toFixed(1)} kg`;
}

function formatHeight(value: number, unit: 'metric' | 'imperial'): string {
  if (unit === 'imperial') {
    const totalInches = value / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${value.toFixed(1)} cm`;
}

function MeasurementItem({
  label,
  value,
  date,
}: {
  label: string;
  value: string | null;
  date: string | null;
}) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={value ? styles.itemValue : styles.notRecorded}>
        {value ?? 'Not recorded'}
      </Text>
      {date ? <Text style={styles.itemDate}>{date}</Text> : null}
    </View>
  );
}

export function MeasurementsSummary({
  latestWeight,
  latestHeight,
  measurementUnit,
}: MeasurementsSummaryProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Measurements</Text>
      <View style={styles.row}>
        <MeasurementItem
          label="Weight"
          value={latestWeight ? formatWeight(latestWeight.value, measurementUnit) : null}
          date={latestWeight?.date ?? null}
        />
        <MeasurementItem
          label="Height"
          value={latestHeight ? formatHeight(latestHeight.value, measurementUnit) : null}
          date={latestHeight?.date ?? null}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  item: {
    flex: 1,
    gap: spacing.xxxs,
  },
  itemLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  itemValue: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  notRecorded: {
    ...typography.bodySmall,
    color: colors.textPlaceholder,
    fontStyle: 'italic',
  },
  itemDate: {
    ...typography.captionSmall,
    color: colors.textPlaceholder,
  },
});
