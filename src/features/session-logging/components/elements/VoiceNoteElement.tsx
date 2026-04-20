import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, radii, touchTargets } from '@/shared/theme';
import type { VoiceNoteConfig } from '@/shared/tracking-elements/types/element-configs';
import type { VoiceNoteValue } from '@/shared/tracking-elements/types/element-values';

interface VoiceNoteElementProps {
  value: VoiceNoteValue;
  onValueChange: (value: VoiceNoteValue) => void;
  config: VoiceNoteConfig;
}

/**
 * Stub component for voice recording. The actual recording logic
 * (expo-audio) will be implemented in a later phase. For now this
 * renders the UI controls so the layout can be tested.
 */
export function VoiceNoteElement({ value, onValueChange, config }: VoiceNoteElementProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasRecording = value.file_uri.length > 0;

  const formatDuration = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleRecord = () => {
    if (isRecording) {
      // Stop recording (stub)
      setIsRecording(false);
      onValueChange({ file_uri: 'recording-stub.m4a', duration_seconds: 5 });
    } else {
      setIsRecording(true);
    }
  };

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    // Playback stub -- no actual audio
  };

  const handleDelete = () => {
    setIsRecording(false);
    setIsPlaying(false);
    onValueChange({ file_uri: '', duration_seconds: 0 });
  };

  return (
    <View style={styles.container}>
      {!hasRecording ? (
        // Record state
        <View style={styles.recordArea}>
          <Pressable
            onPress={handleRecord}
            style={({ pressed }) => [
              styles.recordButton,
              isRecording && styles.recordButtonActive,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={[styles.recordDot, isRecording && styles.recordDotActive]} />
          </Pressable>
          <Text style={styles.hint}>
            {isRecording ? 'Recording... Tap to stop' : 'Tap to record'}
          </Text>
          <Text style={styles.maxDuration}>
            Max: {formatDuration(config.maxDurationSeconds)}
          </Text>
        </View>
      ) : (
        // Playback state
        <View style={styles.playbackArea}>
          <Pressable
            onPress={handlePlay}
            style={({ pressed }) => [styles.playButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.playIcon}>{isPlaying ? '||' : '\u25B6'}</Text>
          </Pressable>
          <View style={styles.playbackInfo}>
            <View style={styles.waveformPlaceholder} />
            <Text style={styles.duration}>{formatDuration(value.duration_seconds)}</Text>
          </View>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  recordArea: {
    alignItems: 'center',
    gap: spacing.sm,
  },
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
  recordButtonActive: {
    backgroundColor: colors.error50,
  },
  recordDot: {
    width: 24,
    height: 24,
    borderRadius: radii.full,
    backgroundColor: colors.error500,
  },
  recordDotActive: {
    borderRadius: radii.xs,
    width: 20,
    height: 20,
  },
  hint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  maxDuration: {
    ...typography.captionSmall,
    color: colors.textPlaceholder,
  },
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
  playIcon: {
    ...typography.buttonSmall,
    color: colors.textOnPrimary,
  },
  playbackInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  waveformPlaceholder: {
    height: 24,
    backgroundColor: colors.borderSubtle,
    borderRadius: radii.xs,
  },
  duration: {
    ...typography.captionSmall,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  deleteText: {
    ...typography.caption,
    color: colors.error500,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
