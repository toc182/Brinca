import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii } from '@/shared/theme';

interface ActivityItem {
  id: string;
  name: string;
  icon: string | null;
}

interface ActivityPickerSheetProps {
  activities: ActivityItem[];
  onSelect: (activity: ActivityItem) => void;
}

export function ActivityPickerSheet({ activities, onSelect }: ActivityPickerSheetProps) {
  return (
    <FlatList
      data={activities}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSelect(item)} style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  row: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  name: { ...typography.titleSmall, color: colors.textPrimary },
});
