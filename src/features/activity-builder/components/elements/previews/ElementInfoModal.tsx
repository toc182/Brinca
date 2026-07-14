import { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X } from 'phosphor-react-native';

import { AppKeyboardToolbar } from '@/shared/components/AppKeyboardToolbar';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, radii, shadows, spacing, touchTargets, typography } from '@/shared/theme';
import {
  ELEMENT_DESCRIPTIONS,
  ELEMENT_LABELS,
  type ElementType,
} from '@/shared/tracking-elements/types/element-types';
import { getDefaultConfig } from '@/shared/tracking-elements/validation';
import { ElementCard } from '@/shared/components/ElementCard';
import { ElementStaticPreview } from '../../ElementStaticPreview';
import { ElementAddConfigRouter } from '../add-configs/ElementAddConfigRouter';

interface ElementInfoModalProps {
  type: ElementType | null;
  onDismiss: () => void;
  onAdd: (type: ElementType, label: string, config: Record<string, unknown>) => void;
  /**
   * Stable identity for the thing being configured. Reset fires when this
   * changes, so editing two elements of the same type reseeds correctly.
   * Defaults to the type. For editing, pass the element's stable id.
   */
  seedKey?: string;
  /** Seed the Name field (edit mode). Falls back to the type's default label. */
  initialLabel?: string;
  /** Seed the config (edit mode). Falls back to the type's default config. */
  initialConfig?: Record<string, unknown>;
  /** Submit button text. Defaults to "Add to drill". */
  submitLabel?: string;
}

export function ElementInfoModal({
  type,
  onDismiss,
  onAdd,
  seedKey,
  initialLabel,
  initialConfig,
  submitLabel = 'Add to drill',
}: ElementInfoModalProps) {
  // Reset whenever the modal opens for a different thing (seedKey, or the type
  // when no seedKey) so leftover values from a prior open don't bleed in.
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const resetKey = seedKey ?? type;

  useEffect(() => {
    if (!type) {
      setLabel('');
      setConfig({});
      return;
    }
    setLabel(initialLabel ?? ELEMENT_LABELS[type]);
    setConfig(initialConfig ?? getDefaultConfig(type));
    // initialLabel/initialConfig are seeds tied to resetKey; intentionally not
    // deps (their identity changes each render and would wipe live edits).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const handleAdd = () => {
    if (!type) return;
    const finalLabel = label.trim() || ELEMENT_LABELS[type];
    onAdd(type, finalLabel, config);
  };

  // Tapping outside while typing should put the keyboard away, not throw the
  // whole modal (and the half-entered config) in the trash. Only a tap with
  // the keyboard already closed dismisses the modal.
  const handleScrimPress = () => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
      return;
    }
    onDismiss();
  };

  return (
    <Modal
      visible={type !== null}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <Pressable style={styles.scrim} onPress={handleScrimPress}>
        <Pressable style={styles.card} onPress={Keyboard.dismiss}>
          {type && (
            <>
              <View style={styles.header}>
                <Text style={styles.title} numberOfLines={1}>{ELEMENT_LABELS[type]}</Text>
                <Pressable
                  onPress={onDismiss}
                  style={styles.closeButton}
                  hitSlop={spacing.sm}
                  accessibilityLabel="Close"
                >
                  <View style={styles.closeCircle}>
                    <X size={18} color={colors.textPrimary} weight="bold" />
                  </View>
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.description}>{ELEMENT_DESCRIPTIONS[type]}</Text>
                <View style={styles.previewWrap}>
                  <ElementCard label={label.trim() || ELEMENT_LABELS[type]}>
                    {/* Merge the type's defaults under the live config so the
                        preview always has required keys (e.g. substeps/items/
                        options) — the config state seeds a render later, and a
                        list element would otherwise crash on that first frame. */}
                    <ElementStaticPreview type={type} config={{ ...getDefaultConfig(type), ...config }} />
                  </ElementCard>
                </View>
                <Input
                  label="Name"
                  value={label}
                  onChangeText={setLabel}
                  placeholder={ELEMENT_LABELS[type]}
                  maxLength={50}
                />
                <ElementAddConfigRouter type={type} value={config} onChange={setConfig} />
                <Button title={submitLabel} onPress={handleAdd} />
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
      <AppKeyboardToolbar />
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxs,
  },
  closeButton: {
    minWidth: touchTargets.min,
    minHeight: touchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
    alignItems: 'stretch',
  },
  previewWrap: {
    paddingVertical: spacing.xxs,
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    flex: 1,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
