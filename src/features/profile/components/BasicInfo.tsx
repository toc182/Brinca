import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/shared/components/Card';
import { colors, typography, spacing } from '@/shared/theme';

interface BasicInfoProps {
  dateOfBirth: string | null;
  gender: string | null;
  country: string | null;
  gradeLevel: string | null;
}

function calculateAge(dateOfBirth: string | null): string | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return `${age} years old`;
}

function formatGender(gender: string | null): string | null {
  if (!gender) return null;
  switch (gender) {
    case 'male':
      return 'Male';
    case 'female':
      return 'Female';
    case 'prefer_not_to_say':
      return 'Prefer not to say';
    default:
      return gender;
  }
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={value ? styles.value : styles.notRecorded}>
        {value ?? 'Not recorded'}
      </Text>
    </View>
  );
}

export function BasicInfo({ dateOfBirth, gender, country, gradeLevel }: BasicInfoProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Basic Info</Text>
      <InfoRow label="Age" value={calculateAge(dateOfBirth)} />
      <InfoRow label="Country" value={country} />
      <InfoRow label="Gender" value={formatGender(gender)} />
      <InfoRow label="Grade" value={gradeLevel} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  value: {
    ...typography.bodySmall,
    fontFamily: 'Lexend_500Medium',
    color: colors.textPrimary,
  },
  notRecorded: {
    ...typography.bodySmall,
    color: colors.textPlaceholder,
    fontStyle: 'italic',
  },
});
