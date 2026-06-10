import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { Button } from '@/shared/components/Button';
import { InBottomSheetContext } from '@/shared/components/BottomSheet';
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
  const sheetRef = useRef<BottomSheetModal>(null);
  const [amount, setAmount] = useState(presetRow ? String(presetRow.amount) : '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const handleCancel = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

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
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['45%']}
      onDismiss={onDismiss}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleStyle={styles.handle}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <InBottomSheetContext.Provider value={true}>
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
            onPress={handleCancel}
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
        </InBottomSheetContext.Provider>
      </BottomSheetScrollView>
    </BottomSheetModal>
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
