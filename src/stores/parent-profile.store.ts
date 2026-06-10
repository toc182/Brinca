import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'parent-profile' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface ParentProfileState {
  displayName: string | null;
  avatarUrl: string | null;
  setProfile: (displayName: string | null, avatarUrl: string | null) => void;
  clearProfile: () => void;
}

export const useParentProfileStore = create<ParentProfileState>()(
  persist(
    immer((set) => ({
      displayName: null,
      avatarUrl: null,
      setProfile: (displayName, avatarUrl) =>
        set((state) => {
          state.displayName = displayName;
          state.avatarUrl = avatarUrl;
        }),
      clearProfile: () =>
        set((state) => {
          state.displayName = null;
          state.avatarUrl = null;
        }),
    })),
    {
      name: 'parent-profile-storage',
      version: 1,
      migrate: (persisted: unknown, _version: number): ParentProfileState => {
        return persisted as ParentProfileState;
      },
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
