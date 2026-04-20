import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radii } from '../theme';

type AvatarSize = 'small' | 'medium' | 'large';

const SIZE_MAP: Record<AvatarSize, number> = {
  small: 32,
  medium: 48,
  large: 80,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  small: 13,
  medium: 17,
  large: 28,
};

interface AvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

export function Avatar({ imageUrl, name, size = 'medium', style }: AvatarProps) {
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const initials = getInitials(name);

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: radii.full,
    overflow: 'hidden',
  };

  if (imageUrl) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, styles.initialsContainer, style]}>
      <Text style={[styles.initialsText, { fontSize }]}>{initials}</Text>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    backgroundColor: colors.primary100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: 'Lexend_600SemiBold',
    color: colors.primary700,
  },
});
