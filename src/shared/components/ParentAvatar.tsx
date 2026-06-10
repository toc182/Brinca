import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { useParentProfileStore } from '@/stores/parent-profile.store';
import { Avatar } from './Avatar';

/**
 * Small circular parent avatar in the top-right corner of screens.
 * Reads cached display name + photo from the parent-profile store,
 * which is populated during auth recovery at app start (see app/_layout.tsx).
 * Tap navigates to Settings.
 */
export function ParentAvatar() {
  const router = useRouter();
  const displayName = useParentProfileStore((s) => s.displayName);
  const avatarUrl = useParentProfileStore((s) => s.avatarUrl);

  return (
    <Pressable
      onPress={() => router.push('/(settings)/menu')}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Avatar imageUrl={avatarUrl} name={displayName ?? ''} size="small" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {},
  pressed: {
    opacity: 0.7,
  },
});
