import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Avatar } from '@/shared/components/Avatar';
import { colors, typography, spacing } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useCreateChildMutation } from '../mutations/useCreateChildMutation';
import { useAuthContext } from '@/shared/contexts/AuthContext';
import type { Gender } from '@/types/domain.types';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function OnboardingStep2Screen() {
  const router = useRouter();
  const { familyId } = useLocalSearchParams<{ familyId: string }>();
  const createChild = useCreateChildMutation();
  const { setAuthState } = useAuthContext();

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);

  const isValid = name.trim().length >= 2 && dateOfBirth !== null && gender !== null;

  const handleContinue = () => {
    if (!familyId || !gender || !dateOfBirth) return;

    createChild.mutate(
      {
        data: {
          name: name.trim(),
          dateOfBirth: dateOfBirth.toISOString().split('T')[0],
          gender,
        },
        familyId,
      },
      {
        onSuccess: ({ childId }) => {
          setAuthState('onboarding-activity');
          router.push({
            pathname: '/(auth)/onboarding/step-3',
            params: { childId },
          });
        },
        onError: () => {
          showToast('error', 'error.generic');
        },
      }
    );
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.stepLabel}>Step 2 of 3</Text>
      <Text style={styles.title}>Who are you tracking?</Text>

      <View style={styles.avatarSection}>
        <Avatar name={name || '?'} size="large" />
      </View>

      <Input
        label="Child's name"
        value={name}
        onChangeText={setName}
        placeholder="First name"
        required
      />

      <Text style={styles.fieldLabel}>Date of birth *</Text>
      <Pressable
        onPress={() => setShowDatePicker(true)}
        style={styles.dateButton}
      >
        <Text style={[styles.dateText, !dateOfBirth && styles.datePlaceholder]}>
          {dateOfBirth ? formatDate(dateOfBirth) : 'Select date of birth'}
        </Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={dateOfBirth ?? new Date(2016, 0, 1)}
          mode="date"
          maximumDate={new Date()}
          minimumDate={new Date(2010, 0, 1)}
          onChange={(_event: DateTimePickerEvent, selected?: Date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) setDateOfBirth(selected);
          }}
        />
      )}

      <Text style={styles.fieldLabel}>Gender *</Text>
      <View style={styles.genderPicker}>
        {GENDER_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setGender(option.value)}
            style={[
              styles.genderChip,
              gender === option.value && styles.genderChipSelected,
            ]}
          >
            <Text
              style={[
                styles.genderChipText,
                gender === option.value && styles.genderChipTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button
        title="Continue"
        onPress={handleContinue}
        disabled={!isValid || createChild.isPending}
        style={styles.continueButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dateButton: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  datePlaceholder: {
    color: colors.textPlaceholder,
  },
  genderPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  genderChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
  },
  genderChipSelected: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary500,
  },
  genderChipText: {
    ...typography.buttonSmall,
    color: colors.textSecondary,
  },
  genderChipTextSelected: {
    color: colors.primary700,
  },
  continueButton: {
    marginTop: spacing.sm,
  },
});
