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
  proxyEnabled: boolean;
  proxyBaseUrl: string;
  setDefaultEngine: (engine: string) => void;
  setTheme: (theme: Theme) => void;
  toggleAdBlock: () => void;
  toggleSpeedUp: () => void;
  setReadingFontSize: (size: number) => void;
  setProxyEnabled: (v: boolean) => void;
  setProxyBaseUrl: (v: string) => void;
  clearAll: () => void;
};

export const DEFAULT_PROXY_BASE_URL = "http://localhost:8787";

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      defaultEngine: DEFAULT_ENGINE_NAME,
      theme: "dark",
      adBlockEnabled: true,
      speedUpEnabled: false,
      readingFontSize: 18,
      proxyEnabled: false,
      proxyBaseUrl: DEFAULT_PROXY_BASE_URL,
      setDefaultEngine: (engine) => set({ defaultEngine: engine }),
      setTheme: (theme) => set({ theme }),
      toggleAdBlock: () => set((s) => ({ adBlockEnabled: !s.adBlockEnabled })),
      toggleSpeedUp: () => set((s) => ({ speedUpEnabled: !s.speedUpEnabled })),
      setReadingFontSize: (size) =>
        set({ readingFontSize: Math.min(28, Math.max(14, size)) }),
      setProxyEnabled: (v) => set({ proxyEnabled: v }),
      setProxyBaseUrl: (v) => set({ proxyBaseUrl: v }),
      clearAll: () =>
        set({
          defaultEngine: DEFAULT_ENGINE_NAME,
          theme: "dark",
          adBlockEnabled: true,
          speedUpEnabled: false,
          readingFontSize: 18,
          proxyEnabled: false,
          proxyBaseUrl: DEFAULT_PROXY_BASE_URL,
        }),
    }),
    { name: "noir_settings" },
  ),
);
