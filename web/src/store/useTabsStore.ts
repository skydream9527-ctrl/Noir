import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  createdAt: number;
};

type TabsState = {
  tabs: Tab[];
  activeId: string | null;
  createTab: (url: string, title?: string) => string;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
  updateTab: (id: string, patch: Partial<Tab>) => void;
  closeAll: () => void;
};

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeId: null,
      createTab: (url, title) => {
        const id = uid();
        const tab: Tab = {
          id,
          url,
          title: title || new URL(url).hostname.replace(/^www\./, ""),
          createdAt: Date.now(),
        };
        set((s) => ({ tabs: [...s.tabs, tab], activeId: id }));
        return id;
      },
      closeTab: (id) => {
        const { tabs, activeId } = get();
        const idx = tabs.findIndex((t) => t.id === id);
        const next = tabs.filter((t) => t.id !== id);
        let nextActive = activeId;
        if (activeId === id) {
          nextActive = next[idx]?.id ?? next[idx - 1]?.id ?? next[0]?.id ?? null;
        }
        set({ tabs: next, activeId: nextActive });
      },
      setActive: (id) => set({ activeId: id }),
      updateTab: (id, patch) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      closeAll: () => set({ tabs: [], activeId: null }),
    }),
    { name: "noir_tabs" },
  ),
);
