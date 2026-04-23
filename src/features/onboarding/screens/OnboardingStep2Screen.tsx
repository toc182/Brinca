import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Avatar } from '@/shared/components/Avatar';
import { Screen } from '@/shared/components/Screen';
import { colors, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useCreateChildMutation } from '../mutations/useCreateChildMutation';
import { useAuthContext } from '@/shared/contexts/AuthContext';
import { useOnboardingStore } from '@/stores/onboarding.store';
import type { Gender } from '@/types/domain.types';

// 5 MB limit matches typical server-side restriction
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function OnboardingStep2Screen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ familyId?: string }>();
  const createChild = useCreateChildMutation();
  const { setAuthState } = useAuthContext();
  const store = useOnboardingStore();

  // familyId comes from route params on first visit; falls back to store on resume
  const familyId = params.familyId ?? store.pendingFamilyId ?? '';

  // Restore form state from store (back-navigation or cold-start resume)
  const [name, setName] = useState(store.step2Name);
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    store.step2Dob ? new Date(store.step2Dob) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender | null>(store.step2Gender);
  const [avatarUri, setAvatarUri] = useState<string | null>(
    store.step2AvatarUri
  );
  const [photoError, setPhotoError] = useState('');

  // Persist family id to store so back-navigation + resume both work
  useEffect(() => {
    if (params.familyId && params.familyId !== store.pendingFamilyId) {
      store.setPendingFamilyId(params.familyId);
    }
  }, [params.familyId]);

  const isValid =
    name.trim().length >= 1 && dateOfBirth !== null && gender !== null;

  const handlePickPhoto = async () => {
    setPhotoError('');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
      setPhotoError('Photo is too large. Please choose a smaller image.');
      return;
    }

    setAvatarUri(asset.uri);
    store.setStep2Data({ avatarUri: asset.uri });
  };

  const handleContinue = () => {
    if (!familyId || !gender || !dateOfBirth) return;

    createChild.mutate(
      {
        data: {
          name: name.trim(),
          dateOfBirth: dateOfBirth.toISOString().split('T')[0],
          gender,
          avatarUri: avatarUri ?? undefined,
        },
        familyId,
      },
      {
        onSuccess: ({ childId }) => {
          store.setPendingChildId(childId);
          store.setStep2Data({ name: '', dob: null, gender: null, avatarUri: null });
          setAuthState('onboarding-activity');
          router.push({
            pathname: '/(auth)/onboarding/step-3',
            params: { childId },
          });
        },
        onError: () => {
          showToast('error', 'Something went wrong. Please try again.');
        },
      }
    );
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <Screen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepLabel}>Step 2 of 3</Text>
        <Text style={styles.title}>Who are you tracking?</Text>

        {/* Tappable photo avatar */}
        <View style={styles.avatarSection}>
          <Pressable
            onPress={handlePickPhoto}
            style={({ pressed }) => [
              styles.avatarPressable,
              pressed && styles.avatarPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Choose child photo"
          >
            <Avatar imageUrl={avatarUri} name={name || '?'} size="large" />
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </Pressable>
          {photoError ? (
            <Text style={styles.photoError}>{photoError}</Text>
          ) : null}
        </View>

        <Input
          label="Child's name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            store.setStep2Data({ name: v });
          }}
          placeholder="First name"
          maxLength={50}
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
              if (selected) {
                setDateOfBirth(selected);
                store.setStep2Data({ dob: selected.toISOString().split('T')[0] });
              }
            }}
          />
        )}

        <Text style={styles.fieldLabel}>Gender *</Text>
        <View style={styles.genderPicker}>
          {GENDER_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                setGender(option.value);
                store.setStep2Data({ gender: option.value });
              }}
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

        {createChild.isPending && (
          <ActivityIndicator color={colors.primary500} style={styles.spinner} />
        )}

        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!isValid || createChild.isPending}
          style={styles.continueButton}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
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
  avatarPressable: {
    position: 'relative',
  },
  avatarPressed: {
    opacity: 0.8,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary500,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 12,
  },
  photoError: {
    ...typography.caption,
    color: colors.error700,
    marginTop: spacing.xs,
    textAlign: 'center',
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
  spinner: {
    marginBottom: spacing.sm,
  },
  continueButton: {
    marginTop: spacing.xs,
  },
});
