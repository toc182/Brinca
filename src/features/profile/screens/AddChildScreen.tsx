// Add-child modal — standalone version of the form used in onboarding step 2.
// Reuses `useCreateChildMutation` from onboarding (cross-feature import is a
// pre-existing pattern in this repo for shared mutations), but keeps its own
// state instead of touching the onboarding store. Submit creates the child,
// invalidates the children list, and dismisses; no step-3 navigation.
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';

import { Avatar } from '@/shared/components/Avatar';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { MODAL_HEADER_CONTENT_BOTTOM, ModalHeader } from '@/shared/components/ModalHeader';
import { useCreateChildMutation } from '@/features/onboarding/mutations/useCreateChildMutation';
import { useActiveChildStore } from '@/stores/active-child.store';
import { colors, radii, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { profileKeys } from '../queries/keys';
import type { Gender } from '@/types/domain.types';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function AddChildScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createChild = useCreateChildMutation();
  const familyId = useActiveChildStore((s) => s.familyId);

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<Gender | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');

  const isValid =
    name.trim().length >= 1 && dateOfBirth !== null && gender !== null;
  const canSave = isValid && !createChild.isPending && !!familyId;

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
  };

  const handleSave = () => {
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
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: profileKeys.children(familyId) });
          showToast('success', 'Child added.');
          router.back();
        },
        onError: () => {
          showToast('error', "Couldn't add child. Please try again.");
        },
      },
    );
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <>
    <ModalHeader
      title="Add child"
      leftAction={{ icon: 'close', onPress: () => router.back(), accessibilityLabel: 'Cancel' }}
      rightAction={{ icon: 'check', onPress: handleSave, disabled: !canSave, accessibilityLabel: 'Save child' }}
    />
    <Screen edges={['bottom']}>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
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
          {photoError ? <Text style={styles.photoError}>{photoError}</Text> : null}
        </View>

        <Input
          label="Child's name"
          value={name}
          onChangeText={setName}
          placeholder="First name"
          maxLength={50}
          required
        />

        {/* Documented pattern: inline accordion chip (docs/ux/forms.md §4).
            Matches MeasurementEditScreen — Keyboard.dismiss() on tap, chip
            recolors when expanded, calendar renders below. Never use
            display="spinner" (legacy) or a bottom-sheet wrapper here. */}
        <View style={styles.dateRow}>
          <Text style={styles.fieldLabel}>Date of birth *</Text>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setShowDatePicker((v) => !v);
            }}
          >
            <View style={[styles.dateChip, showDatePicker && styles.dateChipExpanded]}>
              <Text style={[styles.dateChipText, showDatePicker && styles.dateChipTextExpanded]}>
                {dateOfBirth ? formatDate(dateOfBirth) : 'Select'}
              </Text>
            </View>
          </Pressable>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth ?? new Date(2016, 0, 1)}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            minimumDate={new Date(2010, 0, 1)}
            onChange={(_event: DateTimePickerEvent, selected?: Date) => {
              if (selected) setDateOfBirth(selected);
            }}
            style={styles.inlinePicker}
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

        {createChild.isPending && (
          <ActivityIndicator color={colors.primary500} style={styles.spinner} />
        )}
      </KeyboardAwareScrollView>
    </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
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
  cameraIcon: { fontSize: 12 },
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
  datePlaceholder: { color: colors.textPlaceholder },
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
  genderChipTextSelected: { color: colors.primary700 },
  spinner: { marginBottom: spacing.sm },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dateChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  dateChipExpanded: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary500,
  },
  dateChipText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  dateChipTextExpanded: {
    color: colors.primary500,
  },
  inlinePicker: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
  },
});
