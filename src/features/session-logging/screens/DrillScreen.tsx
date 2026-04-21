import { useCallback, useState, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { colors, typography, spacing } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { useActiveSessionStore } from '@/stores/active-session.store';
import { getDrillById } from '@/features/activity-builder/repositories/drill.repository';
import { getElementsByDrill } from '@/features/activity-builder/repositories/tracking-element.repository';
import { insertDrillResult, markDrillComplete, insertElementValue } from '../repositories/drill-result.repository';
import { ElementRenderer } from '../components/elements/ElementRenderer';
import type { ElementType } from '@/shared/tracking-elements/types/element-types';

export function DrillScreen() {
  const router = useRouter();
  const { drillId } = useLocalSearchParams<{ drillId: string }>();
  const sessionId = useActiveSessionStore((s) => s.sessionId);

  const { data: drill } = useQuery({
    queryKey: ['drill', drillId],
    queryFn: () => getDrillById(drillId!),
    enabled: !!drillId,
  });

  const { data: elements } = useQuery({
    queryKey: ['tracking-elements', drillId],
    queryFn: () => getElementsByDrill(drillId!),
    enabled: !!drillId,
  });

  // Element values stored in local state, saved on finish
  const [values, setValues] = useState<Record<string, Record<string, unknown>>>({});

  const handleValueChange = useCallback((elementId: string, value: Record<string, unknown>) => {
    setValues((prev) => ({ ...prev, [elementId]: value }));
  }, []);

  const handleFinishDrill = async () => {
    if (!sessionId || !drillId) {
      showToast('error', 'Session error. Please restart the session.');
      return;
    }

    try {
      const drillResultId = randomUUID();
      await insertDrillResult(drillResultId, sessionId, drillId);

      // Save all element values
      for (const [elementId, value] of Object.entries(values)) {
        const evId = randomUUID();
        await insertElementValue(evId, drillResultId, elementId, value);
      }

      await markDrillComplete(drillResultId);
      router.back();
    } catch {
      showToast('error', 'Could not save drill. Please try again.');
    }
  };

  return (
    <Screen>
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Text style={styles.drillName}>{drill?.name}</Text>

      {elements?.map((el) => (
        <View key={el.id} style={styles.elementContainer}>
          <Text style={styles.elementLabel}>{el.label}</Text>
          <ElementRenderer
            type={el.type as ElementType}
            config={JSON.parse(el.config)}
            value={values[el.id] ?? {}}
            onValueChange={(v) => handleValueChange(el.id, v)}
          />
        </View>
      ))}

      <Button
        title="Finish drill"
        onPress={handleFinishDrill}
        style={styles.finishButton}
      />
    </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  drillName: { ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.lg },
  elementContainer: { marginBottom: spacing.lg },
  elementLabel: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.sm },
  finishButton: { marginTop: spacing.lg },
});
