import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useUIPreferencesStore } from '@/stores/ui-preferences.store';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { SwipeToDeleteRow } from '@/shared/components/SwipeToDeleteRow';
import { colors, typography, spacing, radii } from '@/shared/theme';
import type { MeasurementType } from '@/types/domain.types';

import { profileKeys } from '../queries/keys';
import {
  getMeasurementsByChild,
  deleteMeasurement,
  type MeasurementRow,
} from '../repositories/measurement.repository';

function formatValue(value: number, type: MeasurementType, unit: 'metric' | 'imperial'): string {
  if (type === 'weight') {
    if (unit === 'imperial') return `${(value * 2.20462).toFixed(1)} lbs`;
    return `${value.toFixed(1)} kg`;
  }
  if (unit === 'imperial') {
    const totalInches = value / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}'${inches}"`;
  }
  return `${value.toFixed(1)} cm`;
}

function MeasurementSection({
  type,
  childId,
  measurementUnit,
  onOpenForm,
}: {
  type: MeasurementType;
  childId: string;
  measurementUnit: 'metric' | 'imperial';
  onOpenForm: (type: MeasurementType, entry?: MeasurementRow) => void;
}) {
  const { data: measurements = [], refetch } = useQuery({
    queryKey: [...profileKeys.measurements(childId), type],
    queryFn: () => getMeasurementsByChild(childId, type),
    enabled: !!childId,
  });

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteMeasurement(id);
      refetch();
    },
    [refetch]
  );

  const label = type === 'weight' ? 'Weight' : 'Height';

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{label}</Text>
        <Button
          title="Add entry"
          variant="secondary"
          size="small"
          onPress={() => onOpenForm(type)}
        />
      </View>

      {measurements.length === 0 ? (
        <EmptyState title="No entries yet." body="" />
      ) : (
        measurements.map((item) => (
          <SwipeToDeleteRow
            key={item.id}
            onDelete={() => handleDelete(item.id)}
            confirmTitle="Delete measurement"
            confirmMessage="Delete this measurement? This cannot be undone."
          >
            <Pressable
              style={styles.entryRow}
              onPress={() => onOpenForm(type, item)}
            >
              <View style={styles.entryInfo}>
                <Text style={styles.entryValue}>
                  {formatValue(item.value, type, measurementUnit)}
                </Text>
                <Text style={styles.entryDate}>{item.date}</Text>
              </View>
            </Pressable>
          </SwipeToDeleteRow>
        ))
      )}
    </View>
  );
}

export function MeasurementsScreen() {
  const router = useRouter();
  const childId = useActiveChildStore((s) => s.childId);
  const measurementUnit = useUIPreferencesStore((s) => s.measurementUnit);

  const handleOpenForm = useCallback(
    (type: MeasurementType, entry?: MeasurementRow) => {
      router.push({
        pathname: '/(settings)/child/measurement-edit' as never,
        params: entry
          ? {
              type,
              id: entry.id,
              value: String(entry.value),
              date: entry.date,
            }
          : { type },
      });
    },
    [router]
  );

  if (!childId) return null;

  return (
    <Screen edges={['bottom']}>
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View style={styles.sectionsContainer}>
            <MeasurementSection
              type="weight"
              childId={childId}
              measurementUnit={measurementUnit}
              onOpenForm={handleOpenForm}
            />
            <MeasurementSection
              type="height"
              childId={childId}
              measurementUnit={measurementUnit}
              onOpenForm={handleOpenForm}
            />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionsContainer: {
    padding: spacing.md,
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  entryInfo: {
    gap: spacing.xxxs,
  },
  entryValue: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  entryDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
