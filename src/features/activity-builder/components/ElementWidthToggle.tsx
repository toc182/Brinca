import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Columns, Square, type Icon } from 'phosphor-react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';
import type { ElementWidth } from '@/shared/tracking-elements/types/element-types';

interface ElementWidthToggleProps {
  value: ElementWidth;
  onChange: (width: ElementWidth) => void;
}

const OPTIONS: { value: ElementWidth; label: string; icon: Icon }[] = [
  { value: 'full', label: 'Full', icon: Square },
  { value: 'half', label: 'Half', icon: Columns },
];

/** Compact Full / Half picker — two icon tiles (a single block vs two columns).
 * Only rendered for element types that support half width (gated by caller). */
export function ElementWidthToggle({ value, onChange }: ElementWidthToggleProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Width</Text>
      <View style={styles.tiles}>
        {OPTIONS.map(({ value: optValue, label, icon: IconCmp }) => {
          const selected = optValue === value;
          return (
            <Pressable
              key={optValue}
              onPress={() => onChange(optValue)}
              style={[styles.tile, selected && styles.tileSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label} width`}
            >
              <IconCmp
                size={20}
                weight={selected ? 'fill' : 'regular'}
                color={selected ? colors.primary500 : colors.textSecondary}
              />
              <Text style={[styles.tileLabel, selected && styles.tileLabelSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...typography.caption, color: colors.textSecondary },
  tiles: { flexDirection: 'row', gap: spacing.xs },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
  },
  tileSelected: { borderColor: colors.primary500, backgroundColor: colors.primary50 },
  tileLabel: { ...typography.bodySmall, color: colors.textSecondary },
  tileLabelSelected: { color: colors.primary700 },
});
