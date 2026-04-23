import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check } from 'phosphor-react-native';

import { Button } from '@/shared/components/Button';
import { colors, iconSizes, radii, spacing, typography } from '@/shared/theme';

interface Activity {
  id: string;
  name: string;
  icon: string | null;
}

interface ActivityFilterModalProps {
  activities: Activity[];
  selectedIds: string[];
  onApply: (ids: string[]) => void;
  onClose: () => void;
}

export function ActivityFilterModal({
  activities,
  selectedIds,
  onApply,
  onClose,
}: ActivityFilterModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const isAllSelected = selected.size === 0;

  const toggleActivity = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set());
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter Activities</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.list}>
          {/* All Activities option */}
          <Pressable style={styles.row} onPress={selectAll}>
            <Text style={styles.activityName}>All Activities</Text>
            {isAllSelected && (
              <Check size={iconSizes.body} color={colors.primary500} weight="bold" />
            )}
          </Pressable>

          {activities.map((activity) => {
            const isChecked = selected.has(activity.id);
            return (
              <Pressable
                key={activity.id}
                style={styles.row}
                onPress={() => toggleActivity(activity.id)}
              >
                <View style={styles.activityInfo}>
                  {activity.icon && <Text style={styles.icon}>{activity.icon}</Text>}
                  <Text style={styles.activityName}>{activity.name}</Text>
                </View>
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked && <Check size={14} color={colors.textOnPrimary} weight="bold" />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Done"
            onPress={() => onApply([...selected])}
            variant="primary"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  title: {
    ...typography.titleSmall,
    color: colors.textPrimary,
  },
  cancelText: {
    ...typography.bodySmall,
    color: colors.primary500,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  activityName: {
    ...typography.body,
    color: colors.textPrimary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.xs,
    borderWidth: 2,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
});