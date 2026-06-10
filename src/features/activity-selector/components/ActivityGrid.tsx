import { FlatList, StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme';
import type { ActivityWithRecency } from '../queries/useActivitiesQuery';
import { ActivityTile } from './ActivityTile';
import { AddActivityTile } from './AddActivityTile';

interface ActivityGridProps {
  activities: ActivityWithRecency[];
  onSelectActivity: (activity: ActivityWithRecency) => void;
  contentTopInset?: number;
}

type GridItem =
  | { kind: 'activity'; index: number; activity: ActivityWithRecency }
  | { kind: 'add' };

export function ActivityGrid({ activities, onSelectActivity, contentTopInset = 0 }: ActivityGridProps) {
  const data: GridItem[] = [
    ...activities.map((activity, index) => ({ kind: 'activity' as const, index, activity })),
    { kind: 'add' as const },
  ];

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => (item.kind === 'activity' ? item.activity.id : '__add__')}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={[styles.content, { paddingTop: contentTopInset + spacing.md }]}
      renderItem={({ item }) =>
        item.kind === 'activity' ? (
          <ActivityTile
            id={item.activity.id}
            name={item.activity.name}
            icon={item.activity.icon}
            lastSessionAt={item.activity.last_session_at}
            paletteIndex={item.index}
            onPress={() => onSelectActivity(item.activity)}
          />
        ) : (
          <AddActivityTile />
        )
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  row: {
    gap: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
});
