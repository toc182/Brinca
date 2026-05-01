import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'ui-preferences' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

type MeasurementUnit = 'metric' | 'imperial';

interface UIPreferencesState {
  measurementUnit: MeasurementUnit;
  currencyName: string;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
  setCurrencyName: (name: string) => void;
}

export const useUIPreferencesStore = create<UIPreferencesState>()(
  persist(
    immer((set) => ({
      measurementUnit: 'metric',
      currencyName: 'Coins',
      setMeasurementUnit: (unit) =>
        set((state) => {
          state.measurementUnit = unit;
        }),
      setCurrencyName: (name) =>
        set((state) => {
          state.currencyName = name;
        }),
    })),
    {
      name: 'ui-preferences-storage',
      version: 1,
      migrate: (persisted: unknown, _version: number): UIPreferencesState => {
        // Currently at version 1 — no migrations needed yet.
        // When bumping the version above, add explicit per-version translation
        // here (e.g., if (version === 1) { /* rename or default new fields */ }).
        return persisted as UIPreferencesState;
      },
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
