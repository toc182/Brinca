import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase/client';
import { Avatar } from './Avatar';

/**
 * Small circular parent avatar in the top-right corner of screens.
 * Self-fetches the parent's display name and photo from Supabase auth metadata.
 * Falls back to initials when no photo is set.
 * Tap navigates to Settings.
 */
export function ParentAvatar() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      const meta = data.user.user_metadata as {
        full_name?: string;
        avatar_url?: string;
        email?: string;
      };
      setName(meta.full_name ?? meta.email ?? '?');
      setImageUrl(meta.avatar_url ?? null);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Pressable
      onPress={() => router.push('/(settings)')}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Avatar imageUrl={imageUrl} name={name || '?'} size="small" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {},
  pressed: {
    opacity: 0.7,
  },
});