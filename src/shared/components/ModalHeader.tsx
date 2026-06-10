import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretLeft, Check, Plus, X } from 'phosphor-react-native';

import { colors, spacing, touchTargets, typography } from '../theme';
import { GradientBlurBackground } from './GradientBlurBackground';

export const MODAL_HEADER_HEIGHT = 88;
// Y-position where the icon row visually ends (12pt buffer + 50pt row).
// Use this + spacing.md as the paddingTop on scrollable content so content
// sits right below the icons (the lower 26pt of the header is fade-zone only).
export const MODAL_HEADER_CONTENT_BOTTOM = 62;

type IconType = 'close' | 'back' | 'check' | 'add';

interface HeaderAction {
  icon: IconType;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}

interface ModalHeaderProps {
  title: string;
  leftAction?: HeaderAction;
  rightAction?: HeaderAction;
}

function renderIcon(type: IconType, color: string) {
  switch (type) {
    case 'close':
      return <X size={20} color={color} weight="bold" />;
    case 'back':
      return <CaretLeft size={22} color={color} weight="bold" />;
    case 'check':
      return <Check size={20} color={color} weight="bold" />;
    case 'add':
      return <Plus size={20} color={color} weight="bold" />;
  }
}

function ActionButton({ action }: { action: HeaderAction }) {
  const color = action.disabled ? colors.textDisabled : colors.textPrimary;
  return (
    <Pressable
      onPress={action.onPress}
      disabled={action.disabled}
      hitSlop={spacing.sm}
      accessibilityLabel={action.accessibilityLabel}
      accessibilityState={action.disabled ? { disabled: true } : undefined}
      style={styles.headerButton}
    >
      <View style={styles.iconCircle}>{renderIcon(action.icon, color)}</View>
    </Pressable>
  );
}

export function ModalHeader({ title, leftAction, rightAction }: ModalHeaderProps) {
  return (
    <View style={[styles.header, { height: MODAL_HEADER_HEIGHT }]}>
      <GradientBlurBackground style={StyleSheet.absoluteFill} fadeStart={0.55} />
      <View style={styles.headerRow}>
        {leftAction ? <ActionButton action={leftAction} /> : <View style={styles.spacer} />}
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        {rightAction ? <ActionButton action={rightAction} /> : <View style={styles.spacer} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerRow: {
    marginTop: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  headerButton: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { width: 50, height: 50 },
  headerTitle: {
    ...typography.titleMedium,
    color: colors.primary500,
    flex: 1,
    textAlign: 'center',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
