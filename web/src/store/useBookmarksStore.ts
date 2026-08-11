import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Bookmark = {
  id: string;
  title: string;
  url: string;
  createdAt: number;
};

type BookmarksState = {
  items: Bookmark[];
  add: (item: Omit<Bookmark, "id" | "createdAt">) => void;
  remove: (id: string) => void;
  has: (url: string) => boolean;
  toggle: (item: Omit<Bookmark, "id" | "createdAt">) => void;
  clear: () => void;
};

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          if (s.items.some((b) => b.url === item.url)) return s;
          return {
            items: [
              { ...item, id: uid(), createdAt: Date.now() },
              ...s.items,
            ],
          };
        }),
      remove: (id) =>
        set((s) => ({ items: s.items.filter((b) => b.id !== id) })),
      has: (url) => get().items.some((b) => b.url === url),
      toggle: (item) => {
        const exists = get().items.some((b) => b.url === item.url);
        if (exists) {
          set((s) => ({ items: s.items.filter((b) => b.url !== item.url) }));
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
    { name: "noir_bookmarks" },
  ),
);
