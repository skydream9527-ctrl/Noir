import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ENGINE_NAME } from "@/data/engines";

export type Theme = "dark" | "light" | "sepia";

type SettingsState = {
  defaultEngine: string;
  theme: Theme;
  adBlockEnabled: boolean;
  speedUpEnabled: boolean;
  readingFontSize: number;
  setDefaultEngine: (engine: string) => void;
  setTheme: (theme: Theme) => void;
  toggleAdBlock: () => void;
  toggleSpeedUp: () => void;
  setReadingFontSize: (size: number) => void;
  clearAll: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultEngine: DEFAULT_ENGINE_NAME,
      theme: "dark",
      adBlockEnabled: true,
      speedUpEnabled: false,
      readingFontSize: 18,
      setDefaultEngine: (engine) => set({ defaultEngine: engine }),
      setTheme: (theme) => set({ theme }),
      toggleAdBlock: () => set((s) => ({ adBlockEnabled: !s.adBlockEnabled })),
      toggleSpeedUp: () => set((s) => ({ speedUpEnabled: !s.speedUpEnabled })),
      setReadingFontSize: (size) =>
        set({ readingFontSize: Math.min(28, Math.max(14, size)) }),
      clearAll: () =>
        set({
          defaultEngine: DEFAULT_ENGINE_NAME,
          theme: "dark",
          adBlockEnabled: true,
          speedUpEnabled: false,
          readingFontSize: 18,
        }),
    }),
    { name: "noir_settings" },
  ),
);
