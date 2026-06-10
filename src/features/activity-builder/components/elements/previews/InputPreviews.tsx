import { StyleSheet, Text, View } from 'react-native';
import { Microphone, Plus } from 'phosphor-react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

export function NumberInputPreview() {
  return (
    <View style={s.numberRow}>
      <View style={s.numberStack}>
        <Text style={s.bigNumber}>42</Text>
        <View style={s.numberUnderline} />
      </View>
      <Text style={s.unit}>kg</Text>
    </View>
  );
}

export function MultiNumberInputPreview() {
  return (
    <View style={s.multiNumberCol}>
      <View style={s.multiNumberInputRow}>
        <View style={s.miniInput}>
          <Text style={s.miniInputText}>12</Text>
        </View>
        <View style={s.miniAddButton}>
          <Plus size={9} color={colors.textOnPrimary} weight="bold" />
        </View>
      </View>
      <View style={s.entryRow}>
        <Text style={s.entryIndex}>1.</Text>
        <Text style={s.entryValue}>15 kg</Text>
      </View>
      <View style={s.entryRow}>
        <Text style={s.entryIndex}>2.</Text>
        <Text style={s.entryValue}>12 kg</Text>
      </View>
    </View>
  );
}

export function FreeTextNotePreview() {
  return (
    <View style={s.noteBox}>
      <View style={[s.noteLine, { width: '85%' }]} />
      <View style={[s.noteLine, { width: '70%' }]} />
      <View style={[s.noteLine, { width: '55%' }]} />
    </View>
  );
}

export function VoiceNotePreview() {
  return (
    <View style={s.voiceRow}>
      <View style={s.recordButton}>
        <Microphone size={14} color={colors.error500} weight="fill" />
      </View>
      <View style={s.waveformRow}>
        {WAVE_HEIGHTS.map((h, i) => (
          <View key={i} style={[s.waveBar, { height: h }]} />
        ))}
      </View>
    </View>
  );
}

const WAVE_HEIGHTS = [10, 18, 26, 14, 22, 30, 16, 24, 12, 20];

const s = StyleSheet.create({
  // Number input
  numberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  numberStack: {
    alignItems: 'center',
  },
  bigNumber: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 32,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  numberUnderline: {
    width: 56,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.borderDefault,
    marginTop: 2,
  },
  unit: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: 4,
  },

  // Multi-number input
  multiNumberCol: {
    width: 124,
    gap: 3,
  },
  multiNumberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  miniInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  miniInputText: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 10,
    color: colors.textPrimary,
  },
  miniAddButton: {
    width: 18,
    height: 18,
    borderRadius: radii.xs,
    backgroundColor: colors.primary500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xxs,
  },
  entryIndex: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 10,
    color: colors.textPlaceholder,
    width: 12,
  },
  entryValue: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 10,
    color: colors.textPrimary,
  },

  // Free text note
  noteBox: {
    width: 124,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    gap: 4,
  },
  noteLine: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSubtle,
  },

  // Voice note
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recordButton: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.error500,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: colors.error500,
  },
});
