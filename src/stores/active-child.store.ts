import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'active-child' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface ActiveChildState {
  childId: string | null;
  childName: string | null;
  familyId: string | null;
  setActiveChild: (childId: string, childName: string, familyId: string) => void;
  clearActiveChild: () => void;
}

export const useActiveChildStore = create<ActiveChildState>()(
  persist(
    immer((set) => ({
      childId: null,
      childName: null,
      familyId: null,
      setActiveChild: (childId, childName, familyId) =>
        set((state) => {
          state.childId = childId;
          state.childName = childName;
          state.familyId = familyId;
        }),
      clearActiveChild: () =>
        set((state) => {
          state.childId = null;
          state.childName = null;
          state.familyId = null;
        }),
    })),
    {
      name: 'active-child-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
