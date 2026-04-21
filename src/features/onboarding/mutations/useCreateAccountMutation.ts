import { useMutation } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { signUp, signIn } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import { insertProfile } from '../repositories/profile.repository';
import { getDatabase } from '@/lib/sqlite/db';
import type { CreateAccountData } from '../types/onboarding.types';

export function useCreateAccountMutation() {
  return useMutation({
    mutationFn: async (data: CreateAccountData) => {
      // 1. Create Supabase auth account
      const authResult = await signUp(data.email, data.password);
      const userId = authResult.user?.id;
      if (!userId) throw new Error('Account creation failed');

      // Establish session immediately so RLS allows subsequent inserts
      await signIn(data.email, data.password);

      // 2. Create profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          display_name: data.displayName,
          persona_type: data.personaType,
        });
      if (profileError) throw profileError;

      // 3. Create family
      const familyId = randomUUID();
      const { error: familyError } = await supabase
        .from('families')
        .insert({ id: familyId });
      if (familyError) throw familyError;

      // 4. Create family_member row (admin)
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyId,
          user_id: userId,
          role: 'admin',
        });
      if (memberError) throw memberError;

      // 5. Save profile and family to local SQLite
      await insertProfile(userId, data.displayName, data.personaType);
      const db = await getDatabase();
      await db.runAsync(
        `INSERT OR IGNORE INTO families (id) VALUES (?)`,
        familyId
      );
      await db.runAsync(
        `INSERT OR IGNORE INTO family_members (id, family_id, user_id, role) VALUES (?, ?, ?, ?)`,
        randomUUID(), familyId, userId, 'admin'
      );

      return { userId, familyId };
    },
  });
}
