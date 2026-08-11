import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HistoryItem = {
  id: string;
  title: string;
  url: string;
  visitedAt: number;
};

const MAX_HISTORY = 200;

type HistoryState = {
  items: HistoryItem[];
  record: (item: Omit<HistoryItem, "id" | "visitedAt">) => void;
  remove: (id: string) => void;
  clear: () => void;
};

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      record: (item) =>
        set((s) => {
          // 同 URL 去重，新记录置顶
          const filtered = s.items.filter((i) => i.url !== item.url);
          const next = [
            { ...item, id: uid(), visitedAt: Date.now() },
            ...filtered,
          ].slice(0, MAX_HISTORY);
          return { items: next };
        }),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "noir_history" },
  ),
);
