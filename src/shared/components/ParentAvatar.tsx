import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Avatar } from './Avatar';

interface ParentAvatarProps {
  name: string;
  imageUrl?: string | null;
}

/**
 * Small circular avatar in the top-right corner of screens.
 * Tap navigates to Settings.
 */
export function ParentAvatar({ name, imageUrl }: ParentAvatarProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/(settings)')}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Avatar imageUrl={imageUrl} name={name} size="small" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
