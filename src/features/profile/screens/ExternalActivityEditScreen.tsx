import { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { useActiveChildStore } from '@/stores/active-child.store';
import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { Toast } from '@/shared/components/Toast';
import { colors, typography, spacing, radii } from '@/shared/theme';

import { profileKeys } from '../queries/keys';
import { updateExternalActivity } from '../repositories/external-activity.repository';
import { useAddExternalActivityMutation } from '../mutations/useAddExternalActivityMutation';

export function ExternalActivityEditScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    schedule?: string;
    location?: string;
    notes?: string;
  }>();
  const childId = useActiveChildStore((s) => s.childId);
  const queryClient = useQueryClient();
  const addMutation = useAddExternalActivityMutation();

  const isEditing = !!params.id;

  const [name, setName] = useState(params.name ?? '');
  const [schedule, setSchedule] = useState(params.schedule ?? '');
  const [location, setLocation] = useState(params.location ?? '');
  const [notes, setNotes] = useState(params.notes ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const handleSave = useCallback(async () => {
    if (!childId) return;

    if (!name.trim()) {
      setNameError('This field is required.');
      return;
    }

    if (isEditing && params.id) {
      await updateExternalActivity(params.id, {
        name: name.trim(),
        schedule: schedule.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
      });
    } else {
      await addMutation.mutateAsync({
        childId,
        name: name.trim(),
        schedule: schedule.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
      });
    }

    queryClient.invalidateQueries({
      queryKey: profileKeys.externalActivities(childId),
    });

    setToastVisible(true);
    setTimeout(() => router.back(), 800);
  }, [childId, isEditing, params.id, name, schedule, location, notes, addMutation, queryClient, router]);

  return (
    <>
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
            value={name}
            onChangeText={(v) => {
              setName(v);
              setNameError(null);
            }}
            placeholder="Activity name"
            placeholderTextColor={colors.textPlaceholder}
            selectionColor={colors.primary500}
            maxLength={50}
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.fullRowInput}
            value={schedule}
            onChangeText={setSchedule}
            placeholder="Schedule (e.g. Mon & Wed 4-5pm)"
            placeholderTextColor={colors.textPlaceholder}
            selectionColor={colors.primary500}
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.fullRowInput}
            value={location}
            onChangeText={setLocation}
            placeholder="Location"
            placeholderTextColor={colors.textPlaceholder}
            selectionColor={colors.primary500}
          />
          <View style={styles.divider} />
          <TextInput
            style={[styles.fullRowInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Notes"
            placeholderTextColor={colors.textPlaceholder}
            selectionColor={colors.primary500}
            multiline
          />
        </View>

        {nameError ? <Text style={styles.error}>{nameError}</Text> : null}

        <View style={styles.actions}>
          <Button
            title="Save"
            onPress={handleSave}
            disabled={!name.trim() || addMutation.isPending}
          />
        </View>
      </KeyboardAwareScrollView>

      <Toast
        message="Changes saved."
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
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
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
