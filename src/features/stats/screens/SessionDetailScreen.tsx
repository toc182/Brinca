import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { colors, typography, spacing } from '@/shared/theme';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { getSessionDetail } from '../repositories/stats.repository';
import { useDeleteSessionMutation } from '../mutations/useDeleteSessionMutation';
import { statsKeys } from '../queries/keys';

export function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { showDestructiveAlert } = useDestructiveAlert();
  const deleteMutation = useDeleteSessionMutation();

  const { data } = useQuery({
    queryKey: statsKeys.sessionDetail(sessionId ?? ''),
    queryFn: () => getSessionDetail(sessionId!),
    enabled: !!sessionId,
  });

  const handleDelete = () => {
    showDestructiveAlert({
      title: 'Delete session',
      message: 'This will permanently delete this session and all its drill results. Currency earned will not be reversed.',
      onConfirm: () => {
        if (!sessionId) return;
        deleteMutation.mutate({ sessionId }, { onSuccess: () => router.back() });
      },
    });
  };

  if (!data?.session) return null;

  const { session, activityName, drillResults } = data;
  const minutes = Math.floor((session.duration_seconds ?? 0) / 60);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.activity}>{activityName}</Text>
      <Text style={styles.date}>{new Date(session.started_at).toLocaleDateString()}</Text>
      <Text style={styles.duration}>{minutes} min</Text>

      {session.note && (
        <Card style={styles.noteCard}>
          <Text style={styles.noteLabel}>Notes</Text>
          <Text style={styles.noteText}>{session.note}</Text>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Drills ({drillResults.length})</Text>
      {drillResults.map((dr) => (
        <Card key={dr.id} style={styles.drillCard}>
          <Text style={styles.drillName}>{dr.drillName}</Text>
          <Text style={styles.drillStatus}>{dr.is_complete ? 'Completed' : 'Incomplete'}</Text>
          {dr.note && <Text style={styles.drillNote}>{dr.note}</Text>}
        </Card>
      ))}

      <Button
        title="Delete session"
        onPress={handleDelete}
        variant="destructive"
        style={styles.deleteButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  activity: { ...typography.titleLarge, color: colors.textPrimary },
  date: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xxs },
  duration: { ...typography.titleMedium, color: colors.primary500, marginTop: spacing.xs, marginBottom: spacing.lg },
  noteCard: { marginBottom: spacing.md },
  noteLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xxs },
  noteText: { ...typography.bodySmall, color: colors.textPrimary },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.sm },
  drillCard: { marginBottom: spacing.xs },
  drillName: { ...typography.titleSmall, color: colors.textPrimary },
  drillStatus: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  drillNote: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xxs },
  deleteButton: { marginTop: spacing.xl },
});
