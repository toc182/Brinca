import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { supabase } from '@/lib/supabase/client';
import { closeDatabase } from '@/lib/sqlite/db';
import { useActiveChildStore } from '@/stores/active-child.store';
import { useActiveSessionStore } from '@/stores/active-session.store';
import { useOnboardingStore } from '@/stores/onboarding.store';

/**
 * Account deletion flow:
 * 1. Call Edge Function for server-side data deletion (stub — TODO)
 * 2. Sign out from Supabase (invalidate auth)
 * 3. Clear local data: SQLite, MMKV stores, SecureStore
 * 4. Navigate to login
 */
export function useDeleteAccountMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // TODO: Call Edge Function for server-side data deletion
      // This should delete: profiles, children, sessions, family_members,
      // storage objects, and finally the auth.users row.
      // await supabase.functions.invoke('delete-account', {});

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Close and clear SQLite
      await closeDatabase();

      // Clear Zustand persisted stores via MMKV
      useActiveChildStore.getState().clearActiveChild();
      useActiveSessionStore.getState().clearSession();
      useOnboardingStore.getState().clearAll();

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
