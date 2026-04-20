import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { colors, typography, spacing, shadows, radii } from '@/shared/theme';
import { useDrillsQuery } from '../queries/useDrillsQuery';
import { activityBuilderKeys } from '../queries/keys';
import { insertDrill } from '../repositories/drill.repository';
import { showToast } from '@/shared/utils/toast';

export function ActivityDetailScreen() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId: string }>();
  const queryClient = useQueryClient();
  const { data: drills, isLoading } = useDrillsQuery(activityId ?? '');

  const handleAddDrill = async () => {
    if (!activityId) return;
    const id = randomUUID();
    try {
      await insertDrill(id, activityId, 'New Drill');
      queryClient.invalidateQueries({ queryKey: activityBuilderKeys.drills(activityId) });
      router.push(`/(settings)/activities/${activityId}/${id}` as never);
    } catch {
      showToast('error', "Couldn't create drill.");
    }
  };

  if (!drills?.length && !isLoading) {
    return (
      <EmptyState
        title="No drills yet"
        body="Add your first drill to start tracking."
        ctaLabel="Add drill"
        onCtaPress={handleAddDrill}
        style={styles.empty}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={drills}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(settings)/activities/${activityId}/${item.id}` as never)}
            style={styles.row}
          >
            <View style={styles.rowContent}>
              <Text style={styles.drillName}>{item.name}</Text>
              {!item.is_active && (
                <Text style={styles.deactivated}>Deactivated</Text>
              )}
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <Button title="Add drill" onPress={handleAddDrill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1 },
  list: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  rowContent: { flex: 1 },
  drillName: { ...typography.titleSmall, color: colors.textPrimary },
  deactivated: { ...typography.caption, color: colors.warning700, marginTop: spacing.xxs },
  chevron: { ...typography.titleMedium, color: colors.textSecondary },
  footer: { padding: spacing.md },
});
