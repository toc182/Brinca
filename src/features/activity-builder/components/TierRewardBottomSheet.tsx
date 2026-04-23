import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, radii, spacing, typography, shadows } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { insertTierReward, updateTierReward } from '../repositories/tier-reward.repository';

interface TierRewardRow {
  id: string;
  name: string;
  conditions: string;
  currency_amount: number;
}

export interface ConditionItem {
  id: string;
  label: string;
  isDeactivated?: boolean;
}

type Operator = '>=' | '<=' | '=';

interface TierCondition {
  id: string;
  itemId: string;
  itemLabel: string;
  operator: Operator;
  value: string;
}

const OPERATORS: Array<{ label: string; value: Operator }> = [
  { label: '≥', value: '>=' },
  { label: '≤', value: '<=' },
  { label: '=', value: '=' },
];

interface TierRewardBottomSheetProps {
  parentType: 'activity' | 'drill';
  parentId: string;
  tierRow?: TierRewardRow;
  conditionItems: ConditionItem[];
  onDismiss: () => void;
  onSaved: () => void;
}

export function TierRewardBottomSheet({
  parentType,
  parentId,
  tierRow,
  conditionItems,
  onDismiss,
  onSaved,
}: TierRewardBottomSheetProps) {
  const sheetRef = useRef<GorhomBottomSheet>(null);

  const [name, setName] = useState(tierRow?.name ?? '');
  const [amount, setAmount] = useState(String(tierRow?.currency_amount ?? ''));
  const [conditions, setConditions] = useState<TierCondition[]>(() => {
    if (!tierRow?.conditions) return [];
    try {
      const parsed = JSON.parse(tierRow.conditions) as unknown[];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((c) => {
        const cond = c as Record<string, unknown>;
        return {
          id: String(cond.id ?? randomUUID()),
          itemId: String(cond.itemId ?? ''),
          itemLabel: String(cond.itemLabel ?? ''),
          operator: (cond.operator as Operator) ?? '>=',
          value: String(cond.value ?? ''),
        };
      });
    } catch {
      return [];
    }
  });
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

  const addCondition = () => {
    if (conditionItems.length === 0) return;
    const first = conditionItems[0];
    setConditions((prev) => [
      ...prev,
      { id: randomUUID(), itemId: first.id, itemLabel: first.label, operator: '>=', value: '' },
    ]);
  };

  const removeCondition = (condId: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== condId));
  };

  const setConditionItem = (condId: string, item: ConditionItem) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === condId ? { ...c, itemId: item.id, itemLabel: item.label } : c)),
    );
  };

  const setConditionOperator = (condId: string, operator: Operator) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === condId ? { ...c, operator } : c)),
    );
  };

  const setConditionValue = (condId: string, value: string) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === condId ? { ...c, value } : c)),
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('error', 'Tier name is required.');
      return;
    }
    if (conditions.length === 0) {
      showToast('error', 'Add at least one condition.');
      return;
    }
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      showToast('error', 'Enter a valid reward amount.');
      return;
    }

    const conditionsPayload = conditions.map(({ itemId, itemLabel, operator, value }) => ({
      itemId,
      itemLabel,
      operator,
      value: parseInt(value, 10) || 0,
    }));

    setIsSaving(true);
    try {
      if (tierRow) {
        await updateTierReward(tierRow.id, {
          name: name.trim(),
          conditions: conditionsPayload,
          currency_amount: parsedAmount,
        });
      } else {
        await insertTierReward(
          randomUUID(),
          parentType,
          parentId,
          name.trim(),
          conditionsPayload,
          parsedAmount,
        );
      }
      onSaved();
    } catch {
      showToast('error', 'Could not save tier. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={['90%']}
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
        <Text style={styles.title}>{tierRow ? 'Edit tier' : 'Add tier'}</Text>

        <Input
          label="Tier name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Perfect, Great, Good"
          required
        />

        <Input
          label="Reward (coins)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="e.g. 10"
          required
        />

        <View style={styles.conditionsSection}>
          <View style={styles.conditionsHeader}>
            <Text style={styles.sectionTitle}>Conditions</Text>
            <Button
              title="+ Add"
              onPress={addCondition}
              variant="text"
              size="small"
              disabled={conditionItems.length === 0}
            />
          </View>

          {conditionItems.length === 0 && (
            <Text style={styles.emptyConditions}>
              No elements available. Add elements to this drill first.
            </Text>
          )}

          {conditions.length === 0 && conditionItems.length > 0 && (
            <Text style={styles.emptyConditions}>
              No conditions yet. Add at least one condition to save this tier.
            </Text>
          )}

          {conditions.map((cond) => {
            const isDeactivated = conditionItems.find((i) => i.id === cond.itemId)?.isDeactivated;
            return (
              <View key={cond.id} style={styles.conditionCard}>
                {isDeactivated && (
                  <Text style={styles.deactivatedWarning}>
                    ⚠️ This condition references a deactivated element.
                  </Text>
                )}

                <Text style={styles.conditionLabel}>If</Text>
                <View style={styles.itemChips}>
                  {conditionItems.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setConditionItem(cond.id, item)}
                      style={[styles.chip, cond.itemId === item.id && styles.chipSelected]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          cond.itemId === item.id && styles.chipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.conditionRow}>
                  <View style={styles.operatorRow}>
                    {OPERATORS.map((op) => (
                      <Pressable
                        key={op.value}
                        onPress={() => setConditionOperator(cond.id, op.value)}
                        style={[
                          styles.opChip,
                          cond.operator === op.value && styles.opChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.opText,
                            cond.operator === op.value && styles.opTextSelected,
                          ]}
                        >
                          {op.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Input
                    label="Value"
                    value={cond.value}
                    onChangeText={(v) => setConditionValue(cond.id, v)}
                    keyboardType="number-pad"
                    placeholder="0"
                    style={styles.valueInput}
                  />
                </View>

                <Pressable onPress={() => removeCondition(cond.id)} style={styles.removeCondition}>
                  <Text style={styles.removeConditionText}>Remove condition</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button title="Cancel" onPress={onDismiss} variant="secondary" style={styles.cancelButton} />
          <Button
            title={isSaving ? 'Saving…' : 'Save tier'}
            onPress={handleSave}
            disabled={isSaving}
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
  conditionsSection: { gap: spacing.sm },
  conditionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary },
  emptyConditions: {
    ...typography.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  conditionCard: {
    backgroundColor: colors.primary50,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: spacing.xs,
    ...shadows.sm,
  },
  deactivatedWarning: {
    ...typography.caption,
    color: colors.warning700,
  },
  conditionLabel: { ...typography.caption, color: colors.textSecondary },
  itemChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
    maxWidth: 150,
  },
  chipSelected: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  chipText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  chipTextSelected: { color: colors.textOnPrimary },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  operatorRow: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  opChip: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opChipSelected: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  opText: { ...typography.bodySmall, color: colors.textPrimary },
  opTextSelected: { color: colors.textOnPrimary },
  valueInput: { flex: 1 },
  removeCondition: { alignSelf: 'flex-end' },
  removeConditionText: { ...typography.caption, color: colors.error600 },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelButton: { flex: 1 },
  saveButton: { flex: 1 },
});
