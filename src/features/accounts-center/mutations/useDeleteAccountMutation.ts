import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { signOut } from '@/lib/supabase/auth';
import { closeDatabase } from '@/lib/sqlite/db';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useActiveSessionStore } from '@/stores/active-session.store';

/**
 * Two-step account deletion:
 * 1. Sign out from Supabase (invalidate auth)
 * 2. Clear local data: SQLite, MMKV stores, SecureStore
 * 3. Navigate to login
 *
 * Note: actual server-side deletion of user data should be handled
 * by a Supabase Edge Function triggered on auth.users deletion.
 */
export function useDeleteAccountMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // Sign out from Supabase
      await signOut();

      // Close and clear SQLite
      await closeDatabase();

      // Clear Zustand persisted stores via MMKV
      useActiveChildStore.getState().clearActiveChild();
      useActiveSessionStore.getState().clearSession();

      // Clear secure store auth tokens
      try {
        await SecureStore.deleteItemAsync('supabase-auth-token');
      } catch {
        // Token may not exist, safe to ignore
      }
    },
    onSuccess: () => {
      router.replace('/(auth)/login');
    },
  });
}
