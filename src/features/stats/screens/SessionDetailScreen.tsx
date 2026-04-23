import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'phosphor-react-native';

import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ErrorState } from '@/shared/components/ErrorState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { SkeletonPlaceholder } from '@/shared/components/SkeletonPlaceholder';
import { colors, iconSizes, radii, spacing, typography } from '@/shared/theme';
import { useDestructiveAlert } from '@/shared/hooks/useDestructiveAlert';
import { getSessionDetail, type DrillResultDetail, type ElementValueRow } from '../repositories/stats.repository';
import { useDeleteSessionMutation } from '../mutations/useDeleteSessionMutation';
import { statsKeys } from '../queries/keys';

export function SessionDetailScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { showDestructiveAlert } = useDestructiveAlert();
  const deleteMutation = useDeleteSessionMutation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: statsKeys.sessionDetail(sessionId ?? ''),
    queryFn: () => getSessionDetail(sessionId!),
    enabled: !!sessionId,
  });

  // Task 217: Fix delete alert copy to match spec exactly
  const handleDelete = () => {
    showDestructiveAlert({
      title: 'Delete this session?',
      message: 'This cannot be undone.',
      onConfirm: () => {
        if (!sessionId) return;
        deleteMutation.mutate({ sessionId }, { onSuccess: () => router.back() });
      },
    });
  };

  // Task 212: Loading skeleton
  if (isLoading) {
    return (
      <View style={styles.container}>
        <OfflineBanner />
        <SessionDetailSkeleton />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <OfflineBanner />
        <ErrorState onRetry={refetch} />
      </View>
    );
  }

  if (!data?.session) return null;

  const { session, activityName, drillResults } = data;
  const minutes = Math.floor((session.duration_seconds ?? 0) / 60);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <OfflineBanner />

      <Text style={styles.activity}>{activityName}</Text>
      <Text style={styles.date}>{new Date(session.started_at).toLocaleDateString()}</Text>
      <Text style={styles.duration}>{minutes} min</Text>

      {/* Session-level notes */}
      {session.note && (
        <Card style={styles.noteCard}>
          <Text style={styles.noteLabel}>Notes</Text>
          <Text style={styles.noteText}>{session.note}</Text>
        </Card>
      )}

      {/* Session-level photos (task 210) */}
      {session.photo_url && (
        <Image source={{ uri: session.photo_url }} style={styles.photo} />
      )}

      <Text style={styles.sectionTitle}>Drills ({drillResults.length})</Text>

      {drillResults.map((dr) => (
        <DrillResultCard key={dr.id} drill={dr} />
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

// ---------------------------------------------------------------------------
// Drill result card with recorded values + photos
// ---------------------------------------------------------------------------

function DrillResultCard({ drill }: { drill: DrillResultDetail }) {
  return (
    <Card style={styles.drillCard}>
      <View style={styles.drillHeader}>
        <Text style={styles.drillName}>{drill.drillName}</Text>
        {drill.is_complete ? (
          <CheckCircle size={iconSizes.body} color={colors.success500} weight="fill" />
        ) : (
          <XCircle size={iconSizes.body} color={colors.textSecondary} weight="regular" />
        )}
      </View>

      {/* Task 208: Show drill recorded values */}
      {drill.elementValues.length > 0 && (
        <View style={styles.elementValues}>
          {drill.elementValues.map((ev) => (
            <ElementValueDisplay key={ev.id} element={ev} />
          ))}
        </View>
      )}

      {drill.note && <Text style={styles.drillNote}>{drill.note}</Text>}

      {/* Task 209: Drill-level photos */}
      {drill.photo_url && (
        <Image source={{ uri: drill.photo_url }} style={styles.drillPhoto} />
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Element value display
// ---------------------------------------------------------------------------

function ElementValueDisplay({ element }: { element: ElementValueRow }) {
  const parsed = parseElementValue(element.type, element.value);

  return (
    <View style={styles.elementRow}>
      <Text style={styles.elementLabel}>{element.label}</Text>
      <Text style={styles.elementValue}>{parsed}</Text>
    </View>
  );
}

function parseElementValue(type: string, rawValue: string): string {
  try {
    const val = JSON.parse(rawValue);
    switch (type) {
      case 'counter':
      case 'combined_counter':
      case 'number_input':
      case 'rating_scale':
        return String(val.value ?? val.count ?? val);
      case 'split_counter':
        return `L: ${val.left ?? 0} / R: ${val.right ?? 0}`;
      case 'multistep_counter':
        return String(val.total ?? val.count ?? val);
      case 'stopwatch':
      case 'countdown_timer':
      case 'lap_timer':
      case 'interval_timer': {
        const secs = val.elapsed ?? val.duration ?? val.seconds ?? 0;
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
      }
      case 'checklist':
        if (Array.isArray(val.items)) {
          const done = val.items.filter((i: { checked?: boolean }) => i.checked).length;
          return `${done}/${val.items.length}`;
        }
        return String(val);
      case 'single_select':
        return val.selected ?? String(val);
      case 'multi_select':
        if (Array.isArray(val.selected)) return val.selected.join(', ');
        return String(val);
      case 'yes_no':
        return val.answer === true ? 'Yes' : val.answer === false ? 'No' : String(val);
      case 'emoji_face_scale':
        return val.face ?? val.value ?? String(val);
      case 'multi_number_input':
        if (Array.isArray(val.values)) return val.values.join(', ');
        return String(val);
      case 'free_text_note':
        return val.text ?? String(val);
      case 'voice_note':
        return val.duration ? `${Math.ceil(val.duration)}s recording` : 'Recording';
      default:
        return String(val);
    }
  } catch {
    return rawValue || '—';
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton (task 212)
// ---------------------------------------------------------------------------

function SessionDetailSkeleton() {
  return (
    <View style={styles.content}>
      <SkeletonPlaceholder>
        <View style={{ height: 32, width: '60%', borderRadius: radii.sm, marginBottom: spacing.xs }} />
        <View style={{ height: 16, width: '40%', borderRadius: radii.sm, marginBottom: spacing.xs }} />
        <View style={{ height: 20, width: '20%', borderRadius: radii.sm, marginBottom: spacing.lg }} />
        <View style={{ height: 80, borderRadius: radii.md, marginBottom: spacing.md }} />
        <View style={{ height: 20, width: '30%', borderRadius: radii.sm, marginBottom: spacing.sm }} />
        <View style={{ height: 70, borderRadius: radii.md, marginBottom: spacing.xs }} />
        <View style={{ height: 70, borderRadius: radii.md, marginBottom: spacing.xs }} />
        <View style={{ height: 70, borderRadius: radii.md }} />
      </SkeletonPlaceholder>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxxl },
  activity: { ...typography.titleLarge, color: colors.textPrimary },
  date: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xxs },
  duration: { ...typography.titleMedium, color: colors.primary500, marginTop: spacing.xs, marginBottom: spacing.lg },
  noteCard: { marginBottom: spacing.md },
  noteLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xxs },
  noteText: { ...typography.bodySmall, color: colors.textPrimary },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.sm },
  drillCard: { marginBottom: spacing.xs },
  drillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drillName: { ...typography.titleSmall, color: colors.textPrimary, flex: 1 },
  elementValues: { marginTop: spacing.xs },
  elementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxxs,
  },
  elementLabel: { ...typography.caption, color: colors.textSecondary },
  elementValue: { ...typography.bodySmall, color: colors.textPrimary, fontFamily: 'Lexend_600SemiBold' },
  drillNote: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  drillPhoto: {
    width: '100%',
    height: 150,
    borderRadius: radii.sm,
    marginTop: spacing.xs,
  },
  deleteButton: { marginTop: spacing.xl },
});