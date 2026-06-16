import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';
import type { ElementWidth } from '@/shared/tracking-elements/types/element-types';

interface ElementWidthToggleProps {
  value: ElementWidth;
  onChange: (width: ElementWidth) => void;
}

const OPTIONS: { value: ElementWidth; label: string }[] = [
  { value: 'full', label: 'Full width' },
  { value: 'half', label: 'Half width' },
];

/** Segmented Full / Half control. Only rendered for element types that support
 * half width (gated by the caller via ELEMENT_SUPPORTS_HALF_WIDTH). */
export function ElementWidthToggle({ value, onChange }: ElementWidthToggleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Width</Text>
      <View style={styles.segments}>
        {OPTIONS.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.segment, selected && styles.segmentSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={opt.label}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.textSecondary },
  segments: {
    flexDirection: 'row',
    backgroundColor: colors.primary50,
    borderRadius: radii.md,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  segmentSelected: { backgroundColor: colors.primary500 },
  segmentText: { ...typography.bodySmall, color: colors.primary700 },
  segmentTextSelected: { color: colors.textOnPrimary },
});
