import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'phosphor-react-native';

import { colors, radii, spacing, typography } from '@/shared/theme';

const ROW_HEIGHT = 14;
const BOX_SIZE = 12;

export function ChecklistPreview() {
  return (
    <View style={s.col}>
      <Row checked />
      <Row checked />
      <Row />
    </View>
  );
}

function Row({ checked = false }: { checked?: boolean }) {
  return (
    <View style={s.row}>
      <View style={[s.checkbox, checked && s.checkboxChecked]}>
        {checked && <Check size={8} color={colors.textOnPrimary} weight="bold" />}
      </View>
      <View style={[s.labelLine, checked && s.labelLineStrike]} />
    </View>
  );
}

export function SingleSelectPreview() {
  return (
    <View style={s.col}>
      <View style={[s.optionRow, s.optionRowSelected]}>
        <View style={[s.radio, s.radioSelected]}>
          <View style={s.radioDot} />
        </View>
        <View style={s.labelLine} />
      </View>
      <View style={s.optionRow}>
        <View style={s.radio} />
        <View style={s.labelLine} />
      </View>
    </View>
  );
}

export function MultiSelectPreview() {
  return (
    <View style={s.col}>
      <View style={[s.optionRow, s.optionRowSelected]}>
        <View style={[s.checkbox, s.checkboxChecked]}>
          <Check size={8} color={colors.textOnPrimary} weight="bold" />
        </View>
        <View style={s.labelLine} />
      </View>
      <View style={s.optionRow}>
        <View style={s.checkbox} />
        <View style={s.labelLine} />
      </View>
    </View>
  );
}

export function YesNoPreview() {
  return (
    <View style={s.yesNoRow}>
      <View style={[s.yesNoButton, s.yesNoButtonActive]}>
        <Text style={[s.yesNoText, s.yesNoTextActive]}>Yes</Text>
      </View>
      <View style={s.yesNoButton}>
        <Text style={s.yesNoText}>No</Text>
      </View>
    </View>
  );
}

export function RatingScalePreview() {
  return (
    <View style={s.ratingRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <View key={n} style={[s.ratingCell, n === 4 && s.ratingCellSelected]}>
          <Text style={[s.ratingNumber, n === 4 && s.ratingNumberSelected]}>{n}</Text>
        </View>
      ))}
    </View>
  );
}

export function EmojiFaceScalePreview() {
  return (
    <View style={s.facesRow}>
      <Text style={[s.face, s.faceDim]}>{'\u{1F641}'}</Text>
      <View style={s.faceSelected}>
        <Text style={s.face}>{'\u{1F603}'}</Text>
      </View>
      <Text style={[s.face, s.faceDim]}>{'\u{1F929}'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  col: {
    width: 116,
    gap: 4,
  },

  // Checklist
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: ROW_HEIGHT,
  },
  checkbox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: radii.xs,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  labelLine: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSubtle,
  },
  labelLineStrike: {
    opacity: 0.4,
  },

  // Single / multi-select rows (with border + selected fill)
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  optionRowSelected: {
    backgroundColor: colors.primary50,
    borderColor: colors.primary500,
  },
  radio: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary500,
  },
  radioDot: {
    width: 5,
    height: 5,
    borderRadius: radii.full,
    backgroundColor: colors.primary500,
  },

  // Yes / No
  yesNoRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  yesNoButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
    minWidth: 44,
    alignItems: 'center',
  },
  yesNoButtonActive: {
    backgroundColor: colors.accent500,
    borderColor: colors.accent500,
  },
  yesNoText: {
    ...typography.captionSmall,
    fontFamily: 'Lexend_600SemiBold',
    color: colors.textPrimary,
  },
  yesNoTextActive: {
    color: colors.textPrimary,
  },

  // Rating scale
  ratingRow: {
    flexDirection: 'row',
    gap: 3,
  },
  ratingCell: {
    width: 18,
    height: 18,
    borderRadius: radii.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingCellSelected: {
    backgroundColor: colors.primary500,
    borderColor: colors.primary500,
  },
  ratingNumber: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 10,
    color: colors.textPrimary,
  },
  ratingNumberSelected: {
    color: colors.textOnPrimary,
  },

  // Emoji faces
  facesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  face: {
    fontSize: 22,
  },
  faceDim: {
    opacity: 0.45,
  },
  faceSelected: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
  },
});
