import { useMutation } from '@tanstack/react-query';

import { signIn } from '@/lib/supabase/auth';

interface SignInData {
  email: string;
  password: string;
}

export function useSignInMutation() {
  return useMutation({
    mutationFn: async (data: SignInData) => {
      const result = await signIn(data.email, data.password);
      return result;
    },
  });
}
