import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { YesNoConfig } from '@/shared/tracking-elements/types/element-configs';
import type { YesNoValue } from '@/shared/tracking-elements/types/element-values';

interface YesNoElementProps {
  value: YesNoValue;
  onValueChange: (value: YesNoValue) => void;
  config: YesNoConfig;
}

export function YesNoElement({ value, onValueChange, config }: YesNoElementProps) {
  const isYes = value.answer === 'yes';
  const isNo = value.answer === 'no';

  const select = (answer: 'yes' | 'no') => {
    // Toggle off if already selected
    if (value.answer === answer) {
      onValueChange({ answer: null });
    } else {
      onValueChange({ answer });
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => select('yes')}
        style={({ pressed }) => [
          styles.button,
          isYes && styles.buttonYesActive,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.buttonText, isYes && styles.buttonTextActive]}>Yes</Text>
      </Pressable>

      <Pressable
        onPress={() => select('no')}
        style={({ pressed }) => [
          styles.button,
          isNo && styles.buttonNoActive,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={[styles.buttonText, isNo && styles.buttonTextActive]}>No</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
  },
  button: {
    flex: 1,
    maxWidth: 160,
    minHeight: touchTargets.kid,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  buttonYesActive: {
    backgroundColor: colors.success50,
    borderColor: colors.success500,
  },
  buttonNoActive: {
    backgroundColor: colors.error50,
    borderColor: colors.error500,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.buttonLarge,
    color: colors.textPrimary,
  },
  buttonTextActive: {
    color: colors.textPrimary,
  },
});
