import { useMutation } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';

import { supabase } from '@/lib/supabase/client';
import { insertActivity } from '../repositories/activity.repository';
import type { CreateActivityData } from '../types/onboarding.types';

export function useCreateActivityMutation() {
  return useMutation({
    mutationFn: async ({
      data,
      childId,
    }: {
      data: CreateActivityData;
      childId: string;
    }) => {
      const activityId = randomUUID();

      // 1. Insert into Supabase
      const { error } = await supabase.from('activities').insert({
        id: activityId,
        child_id: childId,
        name: data.name,
      });
      if (error) throw error;

      // 2. Insert into local SQLite
      await insertActivity(activityId, childId, data.name);

      return { activityId };
    },
  });
}
