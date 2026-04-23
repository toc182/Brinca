import { createContext, useContext } from 'react';

export type AuthState =
  | 'loading'
  | 'unauthenticated'
  | 'onboarding-verification'
  | 'onboarding-child'
  | 'onboarding-activity'
  | 'authenticated';

export const AuthContext = createContext<{
  setAuthState: (state: AuthState) => void;
}>({
  setAuthState: () => {},
});

export function useAuthContext() {
  return useContext(AuthContext);
}
