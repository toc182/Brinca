import { useMutation } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { supabase } from '@/lib/supabase/client';
import { insertProfile } from '../repositories/profile.repository';
import { getDatabase } from '@/lib/sqlite/db';
import type { PersonaType } from '@/types/domain.types';

interface CompleteSetupData {
  userId: string;
  displayName: string;
  personaType: PersonaType;
}

/**
 * Creates the profile, family, and family_member rows after email verification.
 * Called from EmailVerificationScreen once the Supabase SIGNED_IN event fires.
 */
export function useCompleteAccountSetupMutation() {
  return useMutation({
    mutationFn: async ({ userId, displayName, personaType }: CompleteSetupData) => {
      // 1. Create profile in Supabase
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        display_name: displayName,
        persona_type: personaType,
      });
      if (profileError) throw profileError;

      // 2. Create family
      const familyId = randomUUID();
      const { error: familyError } = await supabase
        .from('families')
        .insert({ id: familyId });
      if (familyError) throw familyError;

      // 3. Create family_member row (admin)
      const { error: memberError } = await supabase.from('family_members').insert({
        family_id: familyId,
        user_id: userId,
        role: 'admin',
      });
      if (memberError) throw memberError;

      // 4. Mirror to local SQLite
      await insertProfile(userId, displayName, personaType);
      const db = await getDatabase();
      await db.runAsync(`INSERT OR IGNORE INTO families (id) VALUES (?)`, familyId);
      await db.runAsync(
        `INSERT OR IGNORE INTO family_members (id, family_id, user_id, role) VALUES (?, ?, ?, ?)`,
        randomUUID(),
        familyId,
        userId,
        'admin'
      );

      return { familyId };
    },
  });
}
