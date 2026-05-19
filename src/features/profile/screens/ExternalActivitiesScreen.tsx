import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useActiveChildStore } from '@/stores/active-child.store';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { Screen } from '@/shared/components/Screen';
import { SwipeToDeleteRow } from '@/shared/components/SwipeToDeleteRow';
import { colors, typography, spacing, radii } from '@/shared/theme';

import { profileKeys } from '../queries/keys';
import {
  getExternalActivitiesByChild,
  deleteExternalActivity,
  type ExternalActivityRow,
} from '../repositories/external-activity.repository';

export function ExternalActivitiesScreen() {
  const router = useRouter();
  const childId = useActiveChildStore((s) => s.childId);
  const queryClient = useQueryClient();

  const { data: activities = [], refetch } = useQuery({
    queryKey: profileKeys.externalActivities(childId ?? ''),
    queryFn: () => getExternalActivitiesByChild(childId!),
    enabled: !!childId,
  });

  const handleOpenForm = useCallback(
    (entry?: ExternalActivityRow) => {
      router.push({
        pathname: '/(settings)/child/external-activity-edit' as never,
        params: entry
          ? {
              id: entry.id,
              name: entry.name,
              schedule: entry.schedule ?? '',
              location: entry.location ?? '',
              notes: entry.notes ?? '',
            }
          : undefined,
      });
    },
    [router]
  );

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
    <Screen edges={['bottom']}>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    borderWidth: 1,
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
});
