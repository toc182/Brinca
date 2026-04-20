import type { PersonaType, Gender } from '@/types/domain.types';

export interface CreateAccountData {
  email: string;
  password: string;
  displayName: string;
  personaType: PersonaType;
}

export interface CreateChildData {
  name: string;
  dateOfBirth: string;
  gender: Gender;
  avatarUri?: string;
}

export interface CreateActivityData {
  name: string;
}

export type OnboardingStep = 'account' | 'child' | 'activity' | 'complete';
