import { useCallback, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useUIPreferencesStore } from '@/stores/ui-preferences.store';
import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { Toast } from '@/shared/components/Toast';
import { colors, typography, spacing, radii } from '@/shared/theme';
import type { MeasurementType } from '@/types/domain.types';

import { profileKeys } from '../queries/keys';
import { useAddMeasurementMutation } from '../mutations/useAddMeasurementMutation';
import { useUpdateMeasurementMutation } from '../mutations/useUpdateMeasurementMutation';

function getUnitLabel(type: MeasurementType, unit: 'metric' | 'imperial'): string {
  if (type === 'weight') return unit === 'imperial' ? 'lbs' : 'kg';
  return unit === 'imperial' ? 'inches' : 'cm';
}

export function MeasurementEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type: MeasurementType;
    id?: string;
    value?: string;
    date?: string;
  }>();
  const childId = useActiveChildStore((s) => s.childId);
  const measurementUnit = useUIPreferencesStore((s) => s.measurementUnit);
  const queryClient = useQueryClient();
  const addMeasurement = useAddMeasurementMutation();
  const updateMeasurement = useUpdateMeasurementMutation();

  const isEditing = !!params.id;
  const type: MeasurementType = params.type ?? 'weight';
  const screenTitle = type === 'weight' ? 'Weight' : 'Height';

  const [value, setValue] = useState(params.value ?? '');
  const [date, setDate] = useState<Date>(params.date ? new Date(params.date) : new Date());
  const [dateExpanded, setDateExpanded] = useState(false);
  const [valueError, setValueError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const handleSave = useCallback(async () => {
    if (!childId) return;

    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || !value.trim()) {
      setValueError('This field is required.');
      return;
    }
    if (numericValue < 0) {
      setValueError('Value must be a positive number.');
      return;
    }

    const dateStr = date.toISOString().slice(0, 10);

    if (isEditing && params.id) {
      await updateMeasurement.mutateAsync({
        id: params.id,
        childId,
        value: numericValue,
        date: dateStr,
      });
    } else {
      await addMeasurement.mutateAsync({
        childId,
        type,
        value: numericValue,
        date: dateStr,
      });
    }

    queryClient.invalidateQueries({
      queryKey: profileKeys.measurements(childId),
    });

    setToastVisible(true);
    setTimeout(() => router.back(), 800);
  }, [childId, isEditing, params.id, type, value, date, addMeasurement, updateMeasurement, queryClient, router]);

  const handleDateChange = useCallback((_event: unknown, selectedDate?: Date) => {
    if (selectedDate) setDate(selectedDate);
  }, []);

  const dateLabel = date.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
    <Stack.Screen options={{ title: screenTitle }} />
    <Screen edges={['bottom']}>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={88}
      >
        <View style={styles.card}>
          <TextInput
            style={styles.fullRowInput}
            value={value}
            onChangeText={(v) => {
              setValue(v);
              setValueError(null);
            }}
            keyboardType="decimal-pad"
            placeholder={screenTitle}
            placeholderTextColor={colors.textPlaceholder}
            selectionColor={colors.primary500}
          />
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Unit</Text>
            <Text style={styles.rowValue}>{getUnitLabel(type, measurementUnit)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Date</Text>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setDateExpanded((v) => !v);
              }}
            >
              <View style={[styles.dateChip, dateExpanded && styles.dateChipExpanded]}>
                <Text style={[styles.dateChipText, dateExpanded && styles.dateChipTextExpanded]}>
                  {dateLabel}
                </Text>
              </View>
            </Pressable>
          </View>
          {dateExpanded ? (
            <DateTimePicker
              value={date}
              mode="date"
              display="inline"
              maximumDate={new Date()}
              onChange={handleDateChange}
              style={styles.inlinePicker}
            />
          ) : null}
        </View>

        {valueError ? <Text style={styles.error}>{valueError}</Text> : null}

        <View style={styles.actions}>
          <Button
            title="Save"
            onPress={handleSave}
            disabled={!value.trim() || addMeasurement.isPending || updateMeasurement.isPending}
          />
        </View>
      </KeyboardAwareScrollView>

      <Toast
        message="Entry saved."
        variant="success"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </Screen>
    <AppKeyboardToolbar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  fullRowInput: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  rowValue: {
    ...typography.body,
    color: colors.textSecondary,
  },
  dateChip: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
  },
  dateChipExpanded: {
    backgroundColor: colors.primary50,
  },
  dateChipText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dateChipTextExpanded: {
    color: colors.primary500,
  },
  inlinePicker: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSubtle,
    marginLeft: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.error700,
    marginLeft: spacing.md,
  },
  actions: {
    marginTop: spacing.md,
  },
});
