import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card } from '@/shared/components/Card';
import { colors, typography, spacing } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import { ELEMENT_LABELS, type ElementType } from '@/shared/tracking-elements/types/element-types';
import { getDefaultConfig } from '@/shared/tracking-elements/validation';
import { getDrillById, updateDrill } from '../repositories/drill.repository';
import { getElementsByDrill, insertElement } from '../repositories/tracking-element.repository';
import { activityBuilderKeys } from '../queries/keys';
import { ElementConfigRouter } from '../components/elements/ElementConfigRouter';

export function DrillEditScreen() {
  const { drillId } = useLocalSearchParams<{ drillId: string }>();
  const queryClient = useQueryClient();

  const { data: drill } = useQuery({
    queryKey: activityBuilderKeys.drill(drillId ?? ''),
    queryFn: () => getDrillById(drillId!),
    enabled: !!drillId,
  });

  const { data: elements, refetch: refetchElements } = useQuery({
    queryKey: activityBuilderKeys.elements(drillId ?? ''),
    queryFn: () => getElementsByDrill(drillId!),
    enabled: !!drillId,
  });

  const [name, setName] = useState('');

  useEffect(() => {
    if (drill) setName(drill.name);
  }, [drill]);

  const handleSaveName = async () => {
    if (!drillId || !name.trim()) return;
    await updateDrill(drillId, { name: name.trim() });
    showToast('success', 'Changes saved');
  };

  const handleAddElement = async (type: ElementType) => {
    if (!drillId) return;
    const id = randomUUID();
    const config = getDefaultConfig(type);
    await insertElement(id, drillId, type, ELEMENT_LABELS[type], config);
    refetchElements();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Input
        label="Drill name"
        value={name}
        onChangeText={setName}
        onBlur={handleSaveName}
        required
      />

      <Text style={styles.sectionTitle}>Tracking elements</Text>

      {elements?.map((el) => (
        <Card key={el.id} style={styles.elementCard}>
          <Text style={styles.elementLabel}>{el.label}</Text>
          <Text style={styles.elementType}>{ELEMENT_LABELS[el.type as ElementType]}</Text>
          <ElementConfigRouter
            elementId={el.id}
            type={el.type as ElementType}
            config={JSON.parse(el.config)}
            onConfigChange={refetchElements}
          />
        </Card>
      ))}

      <Text style={styles.sectionTitle}>Add element</Text>
      <View style={styles.elementPicker}>
        {(Object.keys(ELEMENT_LABELS) as ElementType[]).map((type) => (
          <Button
            key={type}
            title={ELEMENT_LABELS[type]}
            onPress={() => handleAddElement(type)}
            variant="secondary"
            size="small"
            style={styles.elementPickerButton}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  elementCard: { marginBottom: spacing.sm },
  elementLabel: { ...typography.titleSmall, color: colors.textPrimary },
  elementType: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  elementPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  elementPickerButton: { marginBottom: spacing.xxs },
});
