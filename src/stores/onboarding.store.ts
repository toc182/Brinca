import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

import type { PersonaType, Gender } from '@/types/domain.types';

const storage = createMMKV({ id: 'onboarding' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface OnboardingState {
  // Resume identifiers — survive app kill
  pendingVerificationEmail: string | null;
  pendingFamilyId: string | null;
  pendingChildId: string | null;

  // Step 1 form data — preserved across back-navigation and cold-start
  step1Email: string;
  step1Name: string;
  step1Persona: PersonaType | null;

  // Step 2 form data — preserved across back-navigation
  step2Name: string;
  step2Dob: string | null; // ISO date string e.g. "2016-03-15"
  step2Gender: Gender | null;
  step2AvatarUri: string | null;

  // Actions
  setPendingVerificationEmail: (email: string | null) => void;
  setPendingFamilyId: (id: string | null) => void;
  setPendingChildId: (id: string | null) => void;
  setStep1Data: (data: {
    email?: string;
    name?: string;
    persona?: PersonaType | null;
  }) => void;
  setStep2Data: (data: {
    name?: string;
    dob?: string | null;
    gender?: Gender | null;
    avatarUri?: string | null;
  }) => void;
  clearAll: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    immer((set) => ({
      pendingVerificationEmail: null,
      pendingFamilyId: null,
      pendingChildId: null,
      step1Email: '',
      step1Name: '',
      step1Persona: null,
      step2Name: '',
      step2Dob: null,
      step2Gender: null,
      step2AvatarUri: null,

      setPendingVerificationEmail: (email) =>
        set((state) => { state.pendingVerificationEmail = email; }),

      setPendingFamilyId: (id) =>
        set((state) => { state.pendingFamilyId = id; }),

      setPendingChildId: (id) =>
        set((state) => { state.pendingChildId = id; }),

      setStep1Data: (data) =>
        set((state) => {
          if (data.email !== undefined) state.step1Email = data.email;
          if (data.name !== undefined) state.step1Name = data.name;
          if ('persona' in data) state.step1Persona = data.persona ?? null;
        }),

      setStep2Data: (data) =>
        set((state) => {
          if (data.name !== undefined) state.step2Name = data.name;
          if ('dob' in data) state.step2Dob = data.dob ?? null;
          if ('gender' in data) state.step2Gender = data.gender ?? null;
          if ('avatarUri' in data) state.step2AvatarUri = data.avatarUri ?? null;
        }),

      clearAll: () =>
        set((state) => {
          state.pendingVerificationEmail = null;
          state.pendingFamilyId = null;
          state.pendingChildId = null;
          state.step1Email = '';
          state.step1Name = '';
          state.step1Persona = null;
          state.step2Name = '';
          state.step2Dob = null;
          state.step2Gender = null;
          state.step2AvatarUri = null;
        }),
    })),
    {
      name: 'onboarding-storage',
      version: 1,
      migrate: (persisted) => persisted as Record<string, unknown>,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
