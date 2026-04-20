import { useMutation } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { supabase } from '@/lib/supabase/client';
import { useActiveChildStore } from '@/stores/active-child.store';
import { insertChild } from '../repositories/child.repository';
import type { CreateChildData } from '../types/onboarding.types';

export function useCreateChildMutation() {
  return useMutation({
    mutationFn: async ({
      data,
      familyId,
    }: {
      data: CreateChildData;
      familyId: string;
    }) => {
      const childId = randomUUID();

      // 1. Insert into Supabase
      const { error } = await supabase.from('children').insert({
        id: childId,
        family_id: familyId,
        name: data.name,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        avatar_url: data.avatarUri ?? null,
      });
      if (error) throw error;

      // 2. Insert into local SQLite
      await insertChild(
        childId,
        familyId,
        data.name,
        data.dateOfBirth,
        data.gender,
        data.avatarUri
      );

      // 3. Set as active child
      useActiveChildStore.getState().setActiveChild(childId, data.name, familyId);

      return { childId };
    },
  });
}
