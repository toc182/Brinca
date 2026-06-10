import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import { useActiveChildStore } from '@/stores/active-child.store';
import { isLocalAvatarUri } from '@/lib/supabase/avatar';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { Avatar } from '@/shared/components/Avatar';
import { ModalHeader, MODAL_HEADER_CONTENT_BOTTOM } from '@/shared/components/ModalHeader';
import { Input } from '@/shared/components/Input';
import { Screen } from '@/shared/components/Screen';
import { Toast } from '@/shared/components/Toast';
import { colors, typography, spacing, radii } from '@/shared/theme';
import type { Gender, SchoolCalendar } from '@/types/domain.types';

import { useProfileQuery } from '../queries/useProfileQuery';
import { useUpdateChildMutation } from '../mutations/useUpdateChildMutation';

const GENDER_OPTIONS: Array<{ label: string; value: Gender }> = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const CALENDAR_OPTIONS: Array<{ label: string; value: SchoolCalendar }> = [
  { label: 'Panamanian (Feb–Dec)', value: 'panamanian' },
  { label: 'US (Aug–May)', value: 'us' },
  { label: 'Custom', value: 'custom' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function EditProfileScreen() {
  const router = useRouter();
  const childId = useActiveChildStore((s) => s.childId);
  const { isOnline } = useNetworkStatus();
  const { data: profile } = useProfileQuery(childId);
  const updateChild = useUpdateChildMutation();

  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [gradeLevel, setGradeLevel] = useState('');
  const [schoolCalendar, setSchoolCalendar] = useState<SchoolCalendar | null>(null);
  const [calendarStartMonth, setCalendarStartMonth] = useState<number>(0);
  const [calendarEndMonth, setCalendarEndMonth] = useState<number>(11);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Populate form from profile data
  useEffect(() => {
    if (!profile?.child) return;
    const c = profile.child;
    setName(c.name);
    setAvatarUri(c.avatarUrl);
    setDob(c.dateOfBirth ? new Date(c.dateOfBirth) : null);
    setCountry(c.country ?? '');
    setGender((c.gender as Gender) ?? null);
    setGradeLevel(c.gradeLevel ?? '');
  }, [profile]);

  // Load school calendar from raw query (need to read from child row)
  useEffect(() => {
    if (!profile?.child) return;
    // schoolCalendar etc are not on ProfileData, read from child row directly
    // We'll fetch from the existing profile and set defaults
  }, [profile]);

  const hasChanges = useMemo(() => {
    if (!profile?.child) return false;
    const c = profile.child;
    return (
      name !== c.name ||
      isLocalAvatarUri(avatarUri) ||
      (dob ? dob.toISOString().slice(0, 10) : null) !== c.dateOfBirth ||
      (country || null) !== (c.country || null) ||
      gender !== ((c.gender as Gender) ?? null) ||
      (gradeLevel || null) !== (c.gradeLevel || null)
    );
  }, [profile, name, avatarUri, dob, country, gender, gradeLevel]);

  const handlePickPhoto = useCallback(async () => {
    setPhotoError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError('Photo is too large. Please choose a smaller image.');
      return;
    }
    setAvatarUri(asset.uri);
  }, []);

  // Per docs/ux/forms.md §4: do NOT close the picker inside onChange — iOS
  // fires onChange for every wheel/calendar interaction, and auto-closing
  // makes the picker dismiss after the first tap. The accordion chip below
  // is the only thing that toggles the picker.
  const handleDateChange = useCallback((_event: unknown, selectedDate?: Date) => {
    if (selectedDate) setDob(selectedDate);
  }, []);

  const formatDob = (date: Date) =>
    date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const validateAndSave = useCallback(async () => {
    setNameError(null);

    if (!name.trim()) {
      setNameError('This field is required.');
      return;
    }
    if (name.trim().length > 50) {
      setNameError('Name must be under 50 characters.');
      return;
    }
    if (!childId) return;

    const fields: Record<string, unknown> = {
      name: name.trim(),
    };

    // Only persist the photo when the user picked a NEW one (a local file:// URI).
    // The form is seeded with a signed display URL whose token rotates on every
    // refetch; diffing against it would otherwise leak that signed URL back into
    // avatar_url. A freshly-picked photo is always a local file:// URI, which the
    // update mutation uploads to storage before saving the path.
    if (isLocalAvatarUri(avatarUri)) {
      fields.avatar_url = avatarUri;
    }
    if (dob) {
      fields.date_of_birth = dob.toISOString().slice(0, 10);
    }
    if (country.trim()) {
      fields.country = country.trim();
    }
    if (gender) {
      fields.gender = gender;
    }
    if (gradeLevel.trim()) {
      fields.grade_level = gradeLevel.trim();
    }
    if (schoolCalendar) {
      fields.school_calendar = schoolCalendar;
      if (schoolCalendar === 'custom') {
        fields.calendar_start_month = calendarStartMonth;
        fields.calendar_end_month = calendarEndMonth;
      } else {
        fields.calendar_start_month = null;
        fields.calendar_end_month = null;
      }
    }

    await updateChild.mutateAsync({
      childId,
      fields: fields as Parameters<typeof updateChild.mutateAsync>[0]['fields'],
    });

    const message = isOnline ? 'Changes saved.' : 'Changes saved offline.';
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => router.back(), 1200);
  }, [
    childId, name, avatarUri, dob, country, gender, gradeLevel,
    schoolCalendar, calendarStartMonth, calendarEndMonth,
    profile, updateChild, isOnline, router,
  ]);

  return (
    <>
    <ModalHeader
      title="Edit Profile"
      leftAction={{ icon: 'back', onPress: () => router.back(), accessibilityLabel: 'Back' }}
      rightAction={{
        icon: 'check',
        onPress: validateAndSave,
        disabled: !hasChanges || updateChild.isPending || !name.trim(),
        accessibilityLabel: 'Save',
      }}
    />
    <Screen edges={['bottom']}>
    <View style={styles.wrapper}>
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: MODAL_HEADER_CONTENT_BOTTOM + spacing.md }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        bottomOffset={88}
      >
        {/* Avatar */}
        <Pressable onPress={handlePickPhoto} style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <Avatar imageUrl={null} name={name || '?'} size="large" />
          )}
          <Text style={styles.changePhotoLabel}>Change photo</Text>
        </Pressable>
        {photoError ? <Text style={styles.errorText}>{photoError}</Text> : null}

        {/* Name */}
        <Input
          label="Name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            setNameError(null);
          }}
          placeholder="Child's name"
          required
          error={nameError ?? undefined}
          maxLength={50}
        />

        {/* Date of birth — documented inline-accordion chip pattern (docs/ux/forms.md §4).
            Matches AddChildScreen and MeasurementEditScreen. */}
        <View style={styles.dateRow}>
          <Text style={styles.fieldLabel}>Date of birth</Text>
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setShowDatePicker((v) => !v);
            }}
          >
            <View style={[styles.dateChip, showDatePicker && styles.dateChipExpanded]}>
              <Text
                style={[
                  styles.dateChipText,
                  showDatePicker && styles.dateChipTextExpanded,
                ]}
              >
                {dob ? formatDob(dob) : 'Select'}
              </Text>
            </View>
          </Pressable>
        </View>
        {showDatePicker ? (
          <DateTimePicker
            value={dob ?? new Date()}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            onChange={handleDateChange}
            style={styles.inlinePicker}
          />
        ) : null}

        {/* Country */}
        <Input
          label="Country of residence"
          value={country}
          onChangeText={setCountry}
          placeholder="e.g. Panama"
        />

        {/* Gender */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.optionRow}>
            {GENDER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.optionChip,
                  gender === opt.value && styles.optionChipSelected,
                ]}
                onPress={() => setGender(opt.value)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    gender === opt.value && styles.optionChipTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Grade level */}
        <Input
          label="Grade level"
          value={gradeLevel}
          onChangeText={setGradeLevel}
          placeholder="e.g. 4th grade"
        />

        {/* School calendar */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>School calendar</Text>
          <View style={styles.optionColumn}>
            {CALENDAR_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.calendarOption,
                  schoolCalendar === opt.value && styles.calendarOptionSelected,
                ]}
                onPress={() => setSchoolCalendar(opt.value)}
              >
                <Text
                  style={[
                    styles.calendarOptionText,
                    schoolCalendar === opt.value && styles.calendarOptionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {schoolCalendar === 'custom' ? (
          <View style={styles.customCalendar}>
            <View style={styles.monthPicker}>
              <Text style={styles.monthLabel}>Start month</Text>
              <View style={styles.monthChips}>
                {MONTHS.map((m, i) => (
                  <Pressable
                    key={`start-${m}`}
                    style={[
                      styles.monthChip,
                      calendarStartMonth === i && styles.monthChipSelected,
                    ]}
                    onPress={() => setCalendarStartMonth(i)}
                  >
                    <Text
                      style={[
                        styles.monthChipText,
                        calendarStartMonth === i && styles.monthChipTextSelected,
                      ]}
                    >
                      {m.slice(0, 3)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.monthPicker}>
              <Text style={styles.monthLabel}>End month</Text>
              <View style={styles.monthChips}>
                {MONTHS.map((m, i) => (
                  <Pressable
                    key={`end-${m}`}
                    style={[
                      styles.monthChip,
                      calendarEndMonth === i && styles.monthChipSelected,
                    ]}
                    onPress={() => setCalendarEndMonth(i)}
                  >
                    <Text
                      style={[
                        styles.monthChipText,
                        calendarEndMonth === i && styles.monthChipTextSelected,
                      ]}
                    >
                      {m.slice(0, 3)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        ) : null}

      </KeyboardAwareScrollView>

      <Toast
        message={toastMessage}
        variant="success"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        topOffset={MODAL_HEADER_CONTENT_BOTTOM + spacing.sm}
      />
    </View>
    </Screen>
    <AppKeyboardToolbar />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  avatarContainer: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: radii.full,
  },
  changePhotoLabel: {
    ...typography.caption,
    color: colors.primary500,
  },
  errorText: {
    ...typography.caption,
    color: colors.error700,
    textAlign: 'center',
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    fontFamily: 'Lexend_600SemiBold',
    color: colors.textPrimary,
    fontSize: 14,
  },
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
  optionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
  },
  optionChipSelected: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  optionChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  optionChipTextSelected: {
    color: colors.textOnPrimary,
  },
  optionColumn: {
    gap: spacing.xs,
  },
  calendarOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
  },
  calendarOptionSelected: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary500,
  },
  calendarOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  calendarOptionTextSelected: {
    color: colors.primary700,
    fontFamily: 'Lexend_500Medium',
  },
  customCalendar: {
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  monthPicker: {
    gap: spacing.xs,
  },
  monthLabel: {
    ...typography.caption,
    fontFamily: 'Lexend_600SemiBold',
    color: colors.textPrimary,
  },
  monthChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
  },
  monthChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
  },
  monthChipSelected: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  monthChipText: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
  monthChipTextSelected: {
    color: colors.textOnPrimary,
  },
});
