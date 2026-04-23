import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useCallback, useRef } from 'react';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, radii, spacing, typography } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { insertBonusPreset, updateBonusPreset } from '../repositories/bonus-preset.repository';

interface BonusPresetRow {
  id: string;
  amount: number;
}

interface BonusPresetBottomSheetProps {
  parentType: 'activity' | 'drill';
  parentId: string;
  presetRow?: BonusPresetRow;
  onDismiss: () => void;
  onSaved: () => void;
}

export function BonusPresetBottomSheet({
  parentType,
  parentId,
  presetRow,
  onDismiss,
  onSaved,
}: BonusPresetBottomSheetProps) {
  const sheetRef = useRef<GorhomBottomSheet>(null);
  const [amount, setAmount] = useState(presetRow ? String(presetRow.amount) : '');
  const [isSaving, setIsSaving] = useState(false);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  const handleSave = async () => {
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) {
      showToast('error', 'Enter a valid positive amount.');
      return;
    }
    setIsSaving(true);
    try {
      if (presetRow) {
        await updateBonusPreset(presetRow.id, parsed);
      } else {
        await insertBonusPreset(randomUUID(), parentType, parentId, parsed);
      }
      onSaved();
    } catch {
      showToast('error', 'Could not save bonus preset. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={['45%']}
      onClose={onDismiss}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      handleStyle={styles.handle}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{presetRow ? 'Edit bonus preset' : 'Add bonus preset'}</Text>

        <Input
          label="Bonus amount (coins)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="e.g. 5"
          required
        />

        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={onDismiss}
            variant="secondary"
            style={styles.cancelButton}
          />
          <Button
            title={isSaving ? 'Saving…' : 'Save'}
            onPress={handleSave}
            disabled={isSaving || !amount.trim()}
            style={styles.saveButton}
          />
        </View>
      </BottomSheetScrollView>
    </GorhomBottomSheet>
  );
}

const styles = StyleSheet.create({
  handle: { paddingTop: 12, paddingBottom: 8 },
  handleIndicator: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.borderDefault,
  },
  background: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  title: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelButton: { flex: 1 },
  saveButton: { flex: 1 },
});
