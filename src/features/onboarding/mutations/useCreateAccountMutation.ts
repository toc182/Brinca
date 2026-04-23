import { useMutation } from '@tanstack/react-query';

import { signUp } from '@/lib/supabase/auth';
import type { CreateAccountData } from '../types/onboarding.types';

/**
 * Creates a Supabase auth account and sends a verification email.
 * Profile, family, and family_member rows are created AFTER email verification
 * in useCompleteAccountSetupMutation (called from EmailVerificationScreen when
 * the SIGNED_IN event fires after the user clicks the verification link).
 */
export function useCreateAccountMutation() {
  return useMutation({
    mutationFn: async (data: CreateAccountData) => {
      const authResult = await signUp(data.email, data.password);
      const userId = authResult.user?.id;
      if (!userId) throw new Error('Account creation failed');
      return { email: data.email };
    },
  });
}
