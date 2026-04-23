import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useActiveChildStore } from '@/stores/active-child.store';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Input';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { SwipeToDeleteRow } from '@/shared/components/SwipeToDeleteRow';
import { Toast } from '@/shared/components/Toast';
import { colors, typography, spacing, radii } from '@/shared/theme';

import { profileKeys } from '../queries/keys';
import {
  getExternalActivitiesByChild,
  deleteExternalActivity,
  updateExternalActivity,
  type ExternalActivityRow,
} from '../repositories/external-activity.repository';
import { useAddExternalActivityMutation } from '../mutations/useAddExternalActivityMutation';

interface FormState {
  editId: string | null;
  name: string;
  schedule: string;
  location: string;
  notes: string;
}

export function ExternalActivitiesScreen() {
  const childId = useActiveChildStore((s) => s.childId);
  const queryClient = useQueryClient();
  const addMutation = useAddExternalActivityMutation();

  const [formState, setFormState] = useState<FormState | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { data: activities = [], refetch } = useQuery({
    queryKey: profileKeys.externalActivities(childId ?? ''),
    queryFn: () => getExternalActivitiesByChild(childId!),
    enabled: !!childId,
  });

  const handleOpenForm = useCallback(
    (entry?: ExternalActivityRow) => {
      setNameError(null);
      if (entry) {
        setFormState({
          editId: entry.id,
          name: entry.name,
          schedule: entry.schedule ?? '',
          location: entry.location ?? '',
          notes: entry.notes ?? '',
        });
      } else {
        setFormState({
          editId: null,
          name: '',
          schedule: '',
          location: '',
          notes: '',
        });
      }
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!formState || !childId) return;

    if (!formState.name.trim()) {
      setNameError('This field is required.');
      return;
    }

    if (formState.editId) {
      await updateExternalActivity(formState.editId, {
        name: formState.name.trim(),
        schedule: formState.schedule.trim() || null,
        location: formState.location.trim() || null,
        notes: formState.notes.trim() || null,
      });
      setToastMessage('Changes saved.');
    } else {
      await addMutation.mutateAsync({
        childId,
        name: formState.name.trim(),
        schedule: formState.schedule.trim() || null,
        location: formState.location.trim() || null,
        notes: formState.notes.trim() || null,
      });
      setToastMessage('Changes saved.');
    }

    setFormState(null);
    queryClient.invalidateQueries({
      queryKey: profileKeys.externalActivities(childId),
    });
    refetch();
    setToastVisible(true);
  }, [formState, childId, addMutation, queryClient, refetch]);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteExternalActivity(id);
      queryClient.invalidateQueries({
        queryKey: profileKeys.externalActivities(childId ?? ''),
      });
      refetch();
    },
    [childId, queryClient, refetch]
  );

  const renderItem = useCallback(
    ({ item }: { item: ExternalActivityRow }) => (
      <SwipeToDeleteRow
        onDelete={() => handleDelete(item.id)}
        confirmTitle="Delete activity"
        confirmMessage="Delete this activity? This cannot be undone."
      >
        <Pressable
          style={styles.card}
          onPress={() => handleOpenForm(item)}
        >
          <Text style={styles.activityName}>{item.name}</Text>
          {item.schedule ? (
            <Text style={styles.detail}>Schedule: {item.schedule}</Text>
          ) : null}
          {item.location ? (
            <Text style={styles.detail}>Location: {item.location}</Text>
          ) : null}
          {item.notes ? (
            <Text style={styles.detail}>Notes: {item.notes}</Text>
          ) : null}
        </Pressable>
      </SwipeToDeleteRow>
    ),
    [handleDelete, handleOpenForm]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Button
            title="Add activity"
            variant="secondary"
            size="small"
            onPress={() => handleOpenForm()}
            style={styles.addButton}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No external activities yet."
            body="Add activities your child does outside the app."
          />
        }
      />

      {formState ? (
        <BottomSheet
          snapPoints={['60%']}
          onDismiss={() => setFormState(null)}
        >
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {formState.editId ? 'Edit activity' : 'Add activity'}
            </Text>

            <Input
              label="Activity name"
              value={formState.name}
              onChangeText={(v) => {
                setFormState({ ...formState, name: v });
                setNameError(null);
              }}
              placeholder="e.g. Swimming"
              required
              error={nameError ?? undefined}
              maxLength={50}
            />
            <Input
              label="Schedule"
              value={formState.schedule}
              onChangeText={(v) => setFormState({ ...formState, schedule: v })}
              placeholder="e.g. Mon & Wed 4-5pm"
            />
            <Input
              label="Location"
              value={formState.location}
              onChangeText={(v) => setFormState({ ...formState, location: v })}
              placeholder="e.g. City Pool"
            />
            <Input
              label="Notes"
              value={formState.notes}
              onChangeText={(v) => setFormState({ ...formState, notes: v })}
              placeholder="Additional notes"
            />

            <Button
              title="Save"
              onPress={handleSave}
              disabled={!formState.name.trim() || addMutation.isPending}
            />
          </View>
        </BottomSheet>
      ) : null}

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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  addButton: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xxs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  activityName: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  detail: {
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
});
