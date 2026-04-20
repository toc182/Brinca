import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useUIPreferencesStore } from '@/stores/ui-preferences.store';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Input';
import { colors, typography, spacing, radii } from '@/shared/theme';
import type { MeasurementType } from '@/types/domain.types';

import { profileKeys } from '../queries/keys';
import {
  getMeasurementsByChild,
  deleteMeasurement,
  type MeasurementRow,
} from '../repositories/measurement.repository';
import { useAddMeasurementMutation } from '../mutations/useAddMeasurementMutation';

type ActiveTab = 'weight' | 'height';

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

export function MeasurementsScreen() {
  const childId = useActiveChildStore((s) => s.childId);
  const measurementUnit = useUIPreferencesStore((s) => s.measurementUnit);
  const { showDestructiveAlert } = useDestructiveAlert();
  const addMeasurement = useAddMeasurementMutation();

  const [activeTab, setActiveTab] = useState<ActiveTab>('weight');
  const [showForm, setShowForm] = useState(false);
  const [valueInput, setValueInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));

  const { data: measurements = [], refetch } = useQuery({
    queryKey: profileKeys.measurements(childId ?? ''),
    queryFn: () => getMeasurementsByChild(childId!, activeTab),
    enabled: !!childId,
  });

  // Refetch when tab changes
  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setShowForm(false);
    setValueInput('');
  }, []);

  const handleAdd = useCallback(async () => {
    const numericValue = parseFloat(valueInput);
    if (!childId || isNaN(numericValue) || numericValue <= 0) return;

    await addMeasurement.mutateAsync({
      childId,
      type: activeTab,
      value: numericValue,
      date: dateInput,
    });
    setShowForm(false);
    setValueInput('');
    refetch();
  }, [childId, valueInput, dateInput, activeTab, addMeasurement, refetch]);

  const handleDelete = useCallback(
    (id: string) => {
      showDestructiveAlert({
        title: 'Delete entry',
        message: 'Are you sure you want to delete this measurement?',
        onConfirm: async () => {
          await deleteMeasurement(id);
          refetch();
        },
      });
    },
    [showDestructiveAlert, refetch]
  );

  const unitLabel = activeTab === 'weight'
    ? (measurementUnit === 'imperial' ? 'lbs' : 'kg')
    : (measurementUnit === 'imperial' ? 'inches' : 'cm');

  const renderItem = useCallback(
    ({ item }: { item: MeasurementRow }) => (
      <View style={styles.entryRow}>
        <View style={styles.entryInfo}>
          <Text style={styles.entryValue}>
            {formatValue(item.value, activeTab, measurementUnit)}
          </Text>
          <Text style={styles.entryDate}>{item.date}</Text>
        </View>
        <Pressable
          onPress={() => handleDelete(item.id)}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    ),
    [activeTab, measurementUnit, handleDelete]
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'weight' && styles.tabActive]}
          onPress={() => handleTabChange('weight')}
        >
          <Text style={[styles.tabText, activeTab === 'weight' && styles.tabTextActive]}>
            Weight
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'height' && styles.tabActive]}
          onPress={() => handleTabChange('height')}
        >
          <Text style={[styles.tabText, activeTab === 'height' && styles.tabTextActive]}>
            Height
          </Text>
        </Pressable>
      </View>

      {showForm ? (
        <View style={styles.form}>
          <Input
            label={`Value (${unitLabel})`}
            value={valueInput}
            onChangeText={setValueInput}
            keyboardType="decimal-pad"
            placeholder={`Enter ${activeTab} in ${unitLabel}`}
          />
          <Input
            label="Date"
            value={dateInput}
            onChangeText={setDateInput}
            placeholder="YYYY-MM-DD"
          />
          <View style={styles.formActions}>
            <Button
              title="Cancel"
              variant="secondary"
              size="small"
              onPress={() => {
                setShowForm(false);
                setValueInput('');
              }}
            />
            <Button
              title="Save"
              size="small"
              onPress={handleAdd}
              disabled={!valueInput || addMeasurement.isPending}
            />
          </View>
        </View>
      ) : (
        <Button
          title="Add entry"
          variant="secondary"
          size="small"
          onPress={() => setShowForm(true)}
          style={styles.addButton}
        />
      )}

      <FlatList
        data={measurements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title={`No ${activeTab} entries`}
            body={`Add your first ${activeTab} measurement to start tracking.`}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabActive: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  tabText: {
    ...typography.buttonSmall,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textOnPrimary,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  addButton: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  list: {
    gap: spacing.xs,
    paddingBottom: spacing.xxl,
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
  pressed: {
    opacity: 0.7,
  },
  deleteText: {
    ...typography.caption,
    color: colors.error500,
  },
});
