import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
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
      avatarUri !== c.avatarUrl ||
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

  const handleDateChange = useCallback((_event: unknown, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDob(selectedDate);
  }, []);

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

    if (avatarUri !== profile?.child?.avatarUrl) {
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
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

        {/* Date of birth */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Date of birth</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            <Text style={dob ? styles.dateText : styles.datePlaceholder}>
              {dob ? dob.toLocaleDateString() : 'Select date'}
            </Text>
          </Pressable>
        </View>
        {showDatePicker ? (
          <DateTimePicker
            value={dob ?? new Date()}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            onChange={handleDateChange}
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

        <View style={styles.actions}>
          <Button
            title="Save"
            onPress={validateAndSave}
            disabled={!hasChanges || updateChild.isPending || !name.trim()}
          />
        </View>
      </ScrollView>

      <Toast
        message={toastMessage}
        variant="success"
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </View>
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
  dateButton: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    minHeight: 48,
    justifyContent: 'center',
  },
  dateText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  datePlaceholder: {
    ...typography.bodySmall,
    color: colors.textPlaceholder,
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
  actions: {
    marginTop: spacing.md,
  },
});
