import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { EmojiFaceScaleConfig } from '@/shared/tracking-elements/types/element-configs';
import type { EmojiFaceScaleValue } from '@/shared/tracking-elements/types/element-values';

interface EmojiFaceScaleElementProps {
  value: EmojiFaceScaleValue;
  onValueChange: (value: EmojiFaceScaleValue) => void;
  config: EmojiFaceScaleConfig;
}

const FACES_3 = [
  { value: 1, emoji: '\u{1F641}', label: 'Bad' },
  { value: 2, emoji: '\u{1F610}', label: 'OK' },
  { value: 3, emoji: '\u{1F603}', label: 'Great' },
];

const FACES_5 = [
  { value: 1, emoji: '\u{1F622}', label: 'Terrible' },
  { value: 2, emoji: '\u{1F641}', label: 'Bad' },
  { value: 3, emoji: '\u{1F610}', label: 'OK' },
  { value: 4, emoji: '\u{1F642}', label: 'Good' },
  { value: 5, emoji: '\u{1F929}', label: 'Amazing' },
];

export function EmojiFaceScaleElement({ value, onValueChange, config }: EmojiFaceScaleElementProps) {
  const faces = config.faceCount === 3 ? FACES_3 : FACES_5;

  const select = (n: number) => {
    onValueChange({ value: value.value === n ? null : n });
  };

  return (
    <View style={styles.container}>
      {faces.map((face) => {
        const isSelected = value.value === face.value;
        return (
          <Pressable
            key={face.value}
            onPress={() => select(face.value)}
            style={({ pressed }) => [
              styles.faceButton,
              isSelected && styles.faceSelected,
              pressed && styles.facePressed,
            ]}
          >
            <Text style={[styles.emoji, isSelected && styles.emojiSelected]}>{face.emoji}</Text>
            <Text style={[styles.faceLabel, isSelected && styles.faceLabelSelected]}>
              {face.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  faceButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: touchTargets.kid,
    minHeight: touchTargets.kid,
  },
  faceSelected: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
  facePressed: {
    opacity: 0.7,
  },
  emoji: {
    fontSize: 32,
    opacity: 0.5,
  },
  emojiSelected: {
    opacity: 1,
  },
  faceLabel: {
    ...typography.captionSmall,
    color: colors.textPlaceholder,
    marginTop: spacing.xxs,
  },
  faceLabelSelected: {
    color: colors.primary700,
  },
});
