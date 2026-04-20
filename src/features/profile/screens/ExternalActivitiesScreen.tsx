import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useActiveChildStore } from '@/stores/active-child.store';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { Input } from '@/shared/components/Input';
import { colors, typography, spacing, radii } from '@/shared/theme';

import { profileKeys } from '../queries/keys';
import {
  getExternalActivitiesByChild,
  deleteExternalActivity,
  type ExternalActivityRow,
} from '../repositories/external-activity.repository';
import { useAddExternalActivityMutation } from '../mutations/useAddExternalActivityMutation';

export function ExternalActivitiesScreen() {
  const childId = useActiveChildStore((s) => s.childId);
  const queryClient = useQueryClient();
  const { showDestructiveAlert } = useDestructiveAlert();
  const addMutation = useAddExternalActivityMutation();

  const [showForm, setShowForm] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [scheduleInput, setScheduleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  const { data: activities = [], refetch } = useQuery({
    queryKey: profileKeys.externalActivities(childId ?? ''),
    queryFn: () => getExternalActivitiesByChild(childId!),
    enabled: !!childId,
  });

  const resetForm = useCallback(() => {
    setShowForm(false);
    setNameInput('');
    setScheduleInput('');
    setLocationInput('');
    setNotesInput('');
  }, []);

  const handleAdd = useCallback(async () => {
    if (!childId || !nameInput.trim()) return;

    await addMutation.mutateAsync({
      childId,
      name: nameInput.trim(),
      schedule: scheduleInput.trim() || null,
      location: locationInput.trim() || null,
      notes: notesInput.trim() || null,
    });
    resetForm();
    refetch();
  }, [childId, nameInput, scheduleInput, locationInput, notesInput, addMutation, resetForm, refetch]);

  const handleDelete = useCallback(
    (id: string, name: string) => {
      showDestructiveAlert({
        title: 'Delete activity',
        message: `Are you sure you want to delete "${name}"?`,
        onConfirm: async () => {
          await deleteExternalActivity(id);
          queryClient.invalidateQueries({
            queryKey: profileKeys.externalActivities(childId ?? ''),
          });
          refetch();
        },
      });
    },
    [showDestructiveAlert, childId, queryClient, refetch]
  );

  const renderItem = useCallback(
    ({ item }: { item: ExternalActivityRow }) => (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.activityName}>{item.name}</Text>
          <Pressable
            onPress={() => handleDelete(item.id, item.name)}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
        {item.schedule ? (
          <Text style={styles.detail}>Schedule: {item.schedule}</Text>
        ) : null}
        {item.location ? (
          <Text style={styles.detail}>Location: {item.location}</Text>
        ) : null}
        {item.notes ? (
          <Text style={styles.detail}>Notes: {item.notes}</Text>
        ) : null}
      </View>
    ),
    [handleDelete]
  );

  return (
    <View style={styles.container}>
      {showForm ? (
        <View style={styles.form}>
          <Input
            label="Activity name"
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="e.g. Swimming"
            required
          />
          <Input
            label="Schedule"
            value={scheduleInput}
            onChangeText={setScheduleInput}
            placeholder="e.g. Mon & Wed 4-5pm"
          />
          <Input
            label="Location"
            value={locationInput}
            onChangeText={setLocationInput}
            placeholder="e.g. City Pool"
          />
          <Input
            label="Notes"
            value={notesInput}
            onChangeText={setNotesInput}
            placeholder="Additional notes"
          />
          <View style={styles.formActions}>
            <Button
              title="Cancel"
              variant="secondary"
              size="small"
              onPress={resetForm}
            />
            <Button
              title="Add"
              size="small"
              onPress={handleAdd}
              disabled={!nameInput.trim() || addMutation.isPending}
            />
          </View>
        </View>
      ) : (
        <Button
          title="Add external activity"
          variant="secondary"
          size="small"
          onPress={() => setShowForm(true)}
          style={styles.addButton}
        />
      )}

      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No external activities"
            body="Track activities not managed in Brinca, like swimming classes or art school."
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xxs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityName: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    flex: 1,
  },
  detail: {
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
