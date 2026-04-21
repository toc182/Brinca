import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/shared/components/Button';
import { Screen } from '@/shared/components/Screen';
import { colors, typography, spacing } from '@/shared/theme';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useActiveSessionStore } from '@/stores/active-session.store';
import { SessionTimer } from '../components/SessionTimer';
import { DrillListItem } from '../components/DrillListItem';
import { SessionNotes } from '../components/SessionNotes';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { useFinishSessionMutation } from '../mutations/useFinishSessionMutation';
import { getDrillsByActivity } from '@/features/activity-builder/repositories/drill.repository';
import { getDrillResultsBySession } from '../repositories/drill-result.repository';
import { updateSessionNote } from '../repositories/session.repository';

export function SessionScreen() {
  const router = useRouter();
  const sessionId = useActiveSessionStore((s) => s.sessionId);
  const activityId = useActiveSessionStore((s) => s.activityId);
  const activityName = useActiveSessionStore((s) => s.activityName);
  const childId = useActiveChildStore((s) => s.childId);
  const childName = useActiveChildStore((s) => s.childName);
  const timer = useSessionTimer();
  const finishSession = useFinishSessionMutation();

  const [note, setNote] = useState('');

  const { data: drills } = useQuery({
    queryKey: ['drills', activityId],
    queryFn: () => getDrillsByActivity(activityId!),
    enabled: !!activityId,
  });

  const { data: drillResults } = useQuery({
    queryKey: ['drill-results', sessionId],
    queryFn: () => getDrillResultsBySession(sessionId!),
    enabled: !!sessionId,
  });

  const completedDrillIds = new Set(
    drillResults?.filter((dr) => dr.is_complete).map((dr) => dr.drill_id)
  );

  const handleMinimize = () => {
    useActiveSessionStore.getState().setStatus('minimized');
    router.back();
  };

  const handleFinishSession = () => {
    if (!sessionId || !childId) return;
    if (note.trim()) {
      updateSessionNote(sessionId, note.trim());
    }
    finishSession.mutate(
      { sessionId, childId, elapsedSeconds: timer.elapsedSeconds },
      {
        onSuccess: (result) => {
          timer.reset();
          useActiveSessionStore.getState().clearSession();
          router.replace({
            pathname: '/(modals)/session-summary',
            params: {
              sessionId,
              durationSeconds: String(result.durationSeconds),
              tierResults: JSON.stringify(result.tierResults),
              newAccolades: JSON.stringify(result.newAccolades),
            },
          } as never);
        },
      }
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.activityName}>{activityName}</Text>
          <Text style={styles.childName}>{childName}</Text>
        </View>
        <SessionTimer />
        <Pressable onPress={handleMinimize} style={styles.minimizeButton}>
          <Text style={styles.minimizeText}>▼</Text>
        </Pressable>
      </View>

      <FlatList
        data={drills?.filter((d) => d.is_active)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <DrillListItem
            name={item.name}
            isComplete={completedDrillIds.has(item.id)}
            onPress={() => router.push({
              pathname: '/(modals)/session/[drillId]',
              params: { drillId: item.id },
            } as never)}
          />
        )}
        ListFooterComponent={
          <SessionNotes value={note} onChangeText={setNote} />
        }
      />

      <View style={styles.footer}>
        <Button
          title="Finish session"
          onPress={handleFinishSession}
          disabled={finishSession.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  headerInfo: { flex: 1 },
  activityName: { ...typography.titleSmall, color: colors.textPrimary },
  childName: { ...typography.caption, color: colors.textSecondary },
  minimizeButton: { padding: spacing.sm },
  minimizeText: { fontSize: 18, color: colors.textSecondary },
  list: { padding: spacing.md },
  footer: { padding: spacing.md },
});
