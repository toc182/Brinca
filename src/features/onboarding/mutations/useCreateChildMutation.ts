import { useMutation } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { supabase } from '@/lib/supabase/client';
import { isLocalAvatarUri, uploadChildAvatar } from '@/lib/supabase/avatar';
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

      // Upload a picked photo (local file:// URI) to storage and store the
      // resulting path — NOT the device-local URI, which vanishes on reinstall
      // and never reaches the cloud. Non-local values (already a path) pass through.
      let avatarPath: string | null = data.avatarUri ?? null;
      if (isLocalAvatarUri(avatarPath)) {
        avatarPath = await uploadChildAvatar(avatarPath as string, childId);
      }

      // 1. Insert into Supabase
      const { error } = await supabase.from('children').insert({
        id: childId,
        family_id: familyId,
        name: data.name,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        avatar_url: avatarPath,
      });
      if (error) throw error;

      // 2. Insert into local SQLite
      await insertChild(
        childId,
        familyId,
        data.name,
        data.dateOfBirth,
        data.gender,
        avatarPath
      );

      // 3. Set as active child
      useActiveChildStore.getState().setActiveChild(childId, data.name, familyId);

      return { childId };
    },
  });
}
