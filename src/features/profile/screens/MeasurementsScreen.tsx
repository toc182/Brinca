import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useUIPreferencesStore } from '@/stores/ui-preferences.store';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Input';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { SwipeToDeleteRow } from '@/shared/components/SwipeToDeleteRow';
import { Toast } from '@/shared/components/Toast';
import { colors, typography, spacing, radii } from '@/shared/theme';
import type { MeasurementType } from '@/types/domain.types';

import { profileKeys } from '../queries/keys';
import {
  getMeasurementsByChild,
  deleteMeasurement,
  updateMeasurement,
  type MeasurementRow,
} from '../repositories/measurement.repository';
import { useAddMeasurementMutation } from '../mutations/useAddMeasurementMutation';

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

function getUnitLabel(type: MeasurementType, unit: 'metric' | 'imperial'): string {
  if (type === 'weight') return unit === 'imperial' ? 'lbs' : 'kg';
  return unit === 'imperial' ? 'inches' : 'cm';
}

interface MeasurementFormState {
  editId: string | null;
  type: MeasurementType;
  value: string;
  date: Date;
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
  const childId = useActiveChildStore((s) => s.childId);
  const measurementUnit = useUIPreferencesStore((s) => s.measurementUnit);
  const addMeasurement = useAddMeasurementMutation();

  const [formState, setFormState] = useState<MeasurementFormState | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [valueError, setValueError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const handleOpenForm = useCallback(
    (type: MeasurementType, entry?: MeasurementRow) => {
      setValueError(null);
      if (entry) {
        setFormState({
          editId: entry.id,
          type,
          value: String(entry.value),
          date: new Date(entry.date),
        });
      } else {
        setFormState({
          editId: null,
          type,
          value: '',
          date: new Date(),
        });
      }
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!formState || !childId) return;

    const numericValue = parseFloat(formState.value);
    if (isNaN(numericValue) || !formState.value.trim()) {
      setValueError('This field is required.');
      return;
    }
    if (numericValue < 0) {
      setValueError('Value must be a positive number.');
      return;
    }

    const dateStr = formState.date.toISOString().slice(0, 10);

    if (formState.editId) {
      await updateMeasurement(formState.editId, numericValue, dateStr);
    } else {
      await addMeasurement.mutateAsync({
        childId,
        type: formState.type,
        value: numericValue,
        date: dateStr,
      });
    }

    setFormState(null);
    setToastVisible(true);
  }, [formState, childId, addMeasurement]);

  const handleDateChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      setShowDatePicker(false);
      if (selectedDate && formState) {
        setFormState({ ...formState, date: selectedDate });
      }
    },
    [formState]
  );

  if (!childId) return null;

  return (
    <View style={styles.container}>
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

      {formState ? (
        <BottomSheet
          snapPoints={['45%']}
          onDismiss={() => setFormState(null)}
        >
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {formState.editId ? 'Edit entry' : 'Add entry'}
            </Text>

            <Input
              label={`Value`}
              value={formState.value}
              onChangeText={(v) => {
                setFormState({ ...formState, value: v });
                setValueError(null);
              }}
              keyboardType="decimal-pad"
              placeholder={`Enter value`}
              error={valueError ?? undefined}
              required
            />

            <View style={styles.unitRow}>
              <Text style={styles.unitLabel}>Unit</Text>
              <Text style={styles.unitValue}>
                {getUnitLabel(formState.type, measurementUnit)}
              </Text>
            </View>

            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Date</Text>
              <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                <Text style={styles.dateText}>
                  {formState.date.toLocaleDateString()}
                </Text>
              </Pressable>
            </View>

            {showDatePicker ? (
              <DateTimePicker
                value={formState.date}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            ) : null}

            <Button
              title="Save"
              onPress={handleSave}
              disabled={!formState.value.trim() || addMeasurement.isPending}
            />
          </View>
        </BottomSheet>
      ) : null}

      <Toast
        message="Entry saved."
        variant="success"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  // Bottom sheet form
  form: {
    padding: spacing.md,
    gap: spacing.md,
  },
  formTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  unitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  unitLabel: {
    ...typography.caption,
    fontFamily: 'Lexend_600SemiBold',
    color: colors.textPrimary,
    fontSize: 14,
  },
  unitValue: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    ...typography.caption,
    fontFamily: 'Lexend_600SemiBold',
    color: colors.textPrimary,
    fontSize: 14,
  },
  dateButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
});
