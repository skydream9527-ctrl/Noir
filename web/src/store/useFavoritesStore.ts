import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Favorite = {
  id: string;
  title: string;
  url: string;
  createdAt: number;
};

type FavoritesState = {
  items: Favorite[];
  add: (item: Omit<Favorite, "id" | "createdAt">) => void;
  remove: (id: string) => void;
  has: (url: string) => boolean;
  toggle: (item: Omit<Favorite, "id" | "createdAt">) => void;
  clear: () => void;
};

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          if (s.items.some((f) => f.url === item.url)) return s;
          return {
            items: [
              { ...item, id: uid(), createdAt: Date.now() },
              ...s.items,
            ],
          };
        }),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((f) => f.id !== id) })),
      has: (url) => get().items.some((f) => f.url === url),
      toggle: (item) => {
        const exists = get().items.some((f) => f.url === item.url);
        if (exists) {
          set((s) => ({ items: s.items.filter((f) => f.url !== item.url) }));
        } else {
          set((s) => ({
            items: [
              { ...item, id: uid(), createdAt: Date.now() },
              ...s.items,
            ],
          }));
        }
      },
      clear: () => set({ items: [] }),
    }),
    { name: "noir_favorites" },
  ),
);
