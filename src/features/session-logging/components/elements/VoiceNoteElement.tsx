import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioModule, RecordingPresets, useAudioRecorder, useAudioPlayer } from 'expo-audio';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import { showToast } from '@/shared/utils/toast';
import type { VoiceNoteConfig } from '@/shared/tracking-elements/types/element-configs';
import type { VoiceNoteValue } from '@/shared/tracking-elements/types/element-values';

const MAX_DURATION_SECONDS = 180; // 3 minutes
const WAVEFORM_BARS = 20;

interface VoiceNoteElementProps {
  value: VoiceNoteValue;
  onValueChange: (value: VoiceNoteValue) => void;
  config: VoiceNoteConfig;
}

type PermissionState = 'unknown' | 'granted' | 'denied';

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function VoiceNoteElement({ value, onValueChange, config }: VoiceNoteElementProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(value.file_uri || undefined);

  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformAnims = useRef(
    Array.from({ length: WAVEFORM_BARS }, () => new Animated.Value(0.3))
  ).current;

  const hasRecording = value.file_uri.length > 0;

  // Animate waveform bars while recording
  useEffect(() => {
    if (!isRecording) {
      waveformAnims.forEach((anim) => anim.setValue(0.3));
      return;
    }

    const animations = waveformAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 40),
          Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.2, duration: 200, useNativeDriver: false }),
        ])
      )
    );

    const group = Animated.parallel(animations);
    group.start();
    return () => group.stop();
  }, [isRecording, waveformAnims]);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    const status = await AudioModule.getRecordingPermissionsAsync();
    if (status.granted) {
      setPermissionState('granted');
      return true;
    }
    const request = await AudioModule.requestRecordingPermissionsAsync();
    if (request.granted) {
      setPermissionState('granted');
      return true;
    }
    setPermissionState('denied');
    return false;
  }, []);

  const startRecording = async () => {
    const ok = await checkPermission();
    if (!ok) return;

    await recorder.record();
    setIsRecording(true);
    setRecordingSeconds(0);

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => {
        const next = s + 1;
        if (next >= MAX_DURATION_SECONDS) {
          void stopRecording(next);
        }
        return next;
      });
    }, 1000);
  };

  const stopRecording = useCallback(async (finalSeconds?: number) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);

    await recorder.stop();
    const uri = recorder.uri;
    const duration = finalSeconds ?? recordingSeconds;

    if (uri) {
      onValueChange({ file_uri: uri, duration_seconds: duration });
    }

    if (finalSeconds != null && finalSeconds >= MAX_DURATION_SECONDS) {
      showToast('info', 'Maximum 3 minutes reached.');
    }
  }, [recorder, recordingSeconds, onValueChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const handleRecordPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handlePlay = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const handleReRecord = () => {
    Alert.alert(
      'Re-record',
      'Discard this recording and record again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-record',
          style: 'destructive',
          onPress: () => {
            player.pause();
            setIsPlaying(false);
            onValueChange({ file_uri: '', duration_seconds: 0 });
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete recording',
      'Delete this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            player.pause();
            setIsPlaying(false);
            onValueChange({ file_uri: '', duration_seconds: 0 });
          },
        },
      ]
    );
  };

  // Permission denied state
  if (permissionState === 'denied') {
    return (
      <View style={styles.permissionDenied}>
        <Text style={styles.permissionText}>Microphone access required.</Text>
        <Pressable onPress={() => Linking.openSettings()} style={styles.settingsButton}>
          <Text style={styles.settingsButtonText}>Open iOS Settings</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!hasRecording ? (
        // Record / recording state
        <View style={styles.recordArea}>
          <Pressable
            onPress={handleRecordPress}
            style={({ pressed }) => [
              styles.recordButton,
              isRecording && styles.recordButtonActive,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={[styles.recordDot, isRecording && styles.recordDotActive]} />
          </Pressable>

          {isRecording ? (
            <View style={styles.waveformRow}>
              {waveformAnims.map((anim, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    { transform: [{ scaleY: anim }] },
                  ]}
                />
              ))}
            </View>
          ) : null}

          <Text style={styles.hint}>
            {isRecording
              ? `Recording... ${formatDuration(recordingSeconds)} / ${formatDuration(config.maxDurationSeconds)}`
              : 'Tap to record.'}
          </Text>
        </View>
      ) : (
        // Playback state
        <View style={styles.playbackArea}>
          <Pressable
            onPress={handlePlay}
            style={({ pressed }) => [styles.playButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </Pressable>

          <View style={styles.playbackInfo}>
            <View style={styles.waveformPlaceholder} />
            <Text style={styles.duration}>{formatDuration(value.duration_seconds)}</Text>
          </View>

          <View style={styles.actionButtons}>
            <Pressable
              onPress={handleReRecord}
              style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.actionButtonText}>Re-record</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  recordArea: { alignItems: 'center', gap: spacing.sm },
  recordButton: {
    width: touchTargets.kidLarge,
    height: touchTargets.kidLarge,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.error500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: { backgroundColor: colors.error50 },
  recordDot: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.error500,
  },
  recordDotActive: { borderRadius: radii.xs, width: 20, height: 20 },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    gap: 3,
  },
  waveBar: {
    width: 3,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.error500,
  },
  hint: { ...typography.bodySmall, color: colors.textSecondary },
  playbackArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  playButton: {
    width: touchTargets.adult,
    height: touchTargets.adult,
    borderRadius: radii.full,
    backgroundColor: colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { ...typography.buttonSmall, color: colors.textOnPrimary },
  playbackInfo: { flex: 1, gap: spacing.xxs },
  waveformPlaceholder: {
    height: 24,
    backgroundColor: colors.borderSubtle,
    borderRadius: radii.xs,
  },
  duration: { ...typography.captionSmall, color: colors.textSecondary },
  actionButtons: { gap: spacing.xs },
  actionButton: { padding: spacing.xs },
  actionButtonText: { ...typography.caption, color: colors.primary500 },
  deleteButton: { padding: spacing.xs },
  deleteText: { ...typography.caption, color: colors.error500 },
  buttonPressed: { opacity: 0.7 },
  permissionDenied: { alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  permissionText: { ...typography.bodySmall, color: colors.textSecondary },
  settingsButton: {
    backgroundColor: colors.primary500,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  settingsButtonText: { ...typography.buttonSmall, color: colors.textOnPrimary },
});
