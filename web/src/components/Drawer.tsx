import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  History,
  Star,
  Search,
  Trash2,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookmarksStore } from "@/store/useBookmarksStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { getFaviconUrl, prettyUrl } from "@/utils/url";

type Panel = "bookmarks" | "history" | "favorites";

type Props = {
  open: boolean;
  onClose: () => void;
  onNavigate: (url: string, title?: string) => void;
};

export default function Drawer({ open, onClose, onNavigate }: Props) {
  const [panel, setPanel] = useState<Panel>("bookmarks");
  const [q, setQ] = useState("");

  const bookmarks = useBookmarksStore((s) => s.items);
  const history = useHistoryStore((s) => s.items);
  const favorites = useFavoritesStore((s) => s.items);

  const list =
    panel === "bookmarks"
      ? bookmarks
      : panel === "history"
        ? history
        : favorites;

  const filtered = q
    ? list.filter(
        (i) =>
          i.title.toLowerCase().includes(q.toLowerCase()) ||
          i.url.toLowerCase().includes(q.toLowerCase()),
      )
    : list;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
            className="fixed right-0 top-0 z-40 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-ink-900/95 backdrop-blur-2xl"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h3 className="font-display text-base font-semibold text-ink-50">
                我的库
              </h3>
              <button
                onClick={onClose}
                className="btn-ghost h-8 w-8 p-0"
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>

            {/* 切换 */}
            <div className="grid grid-cols-3 gap-1 p-2">
              {([
                { key: "bookmarks", label: "书签", icon: Bookmark, count: bookmarks.length },
                { key: "history", label: "历史", icon: History, count: history.length },
                { key: "favorites", label: "收藏", icon: Star, count: favorites.length },
              ] as const).map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.key}
                    onClick={() => setPanel(it.key as Panel)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl py-2 text-xs transition-colors",
                      panel === it.key
                        ? "bg-white/10 text-ink-50"
                        : "text-ink-400 hover:bg-white/5",
                    )}
                  >
                    <Icon size={16} />
                    <span>{it.label}</span>
                    <span className="text-[10px] text-ink-500">
                      {it.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 搜索 */}
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink-950/60 px-3 py-1.5">
                <Search size={14} className="text-ink-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={`搜索${panel === "bookmarks" ? "书签" : panel === "history" ? "历史" : "收藏"}`}
                  className="min-w-0 flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-500 outline-none"
                />
              </div>
            </div>

            {/* 列表 */}
            <div className="no-scrollbar flex-1 overflow-y-auto px-2 pb-4">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-ink-500">
                  <div className="text-3xl opacity-50">📭</div>
                  <p className="text-sm">暂无内容</p>
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
                  >
                    <img
                      src={getFaviconUrl(item.url)}
                      alt=""
                      className="h-5 w-5 shrink-0 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility =
                          "hidden";
                      }}
                    />
                    <button
                      onClick={() => {
                        onNavigate(item.url, item.title);
                        onClose();
                      }}
                      className="flex min-w-0 flex-1 flex-col items-start"
                    >
                      <span className="truncate text-sm text-ink-100">
                        {item.title}
                      </span>
                      <span className="truncate text-xs text-ink-500">
                        {prettyUrl(item.url)}
                      </span>
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded p-1 text-ink-500 opacity-0 transition-opacity hover:bg-white/10 hover:text-ink-200 group-hover:opacity-100"
                    >
                      <ExternalLink size={13} />
                    </a>
                    <RemoveButton panel={panel} id={item.id} />
                  </div>
                ))
              )}
            </div>

            {/* 底部操作 */}
            <div className="border-t border-white/5 p-3">
              <ClearAllButton panel={panel} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function RemoveButton({ panel, id }: { panel: Panel; id: string }) {
  const removeBookmark = useBookmarksStore((s) => s.remove);
  const removeHistory = useHistoryStore((s) => s.remove);
  const removeFavorite = useFavoritesStore((s) => s.remove);

  return (
    <button
      onClick={() => {
        if (panel === "bookmarks") removeBookmark(id);
        else if (panel === "history") removeHistory(id);
        else removeFavorite(id);
      }}
      className="rounded p-1 text-ink-500 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100"
      aria-label="删除"
    >
      <Trash2 size={13} />
    </button>
  );
}

function ClearAllButton({ panel }: { panel: Panel }) {
  const clearBookmarks = useBookmarksStore((s) => s.clear);
  const clearHistory = useHistoryStore((s) => s.clear);
  const clearFavorites = useFavoritesStore((s) => s.clear);

  return (
    <button
      onClick={() => {
        if (panel === "bookmarks") clearBookmarks();
        else if (panel === "history") clearHistory();
        else clearFavorites();
      }}
      className="btn-ghost w-full justify-center text-red-300 hover:bg-red-500/10"
    >
      <Trash2 size={14} /> 清空{panel === "bookmarks" ? "书签" : panel === "history" ? "历史" : "收藏"}
    </button>
  );
}
