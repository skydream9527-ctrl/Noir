import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Star, ExternalLink, Trash2 } from "lucide-react";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useTabsStore } from "@/store/useTabsStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { getFaviconUrl, prettyUrl } from "@/utils/url";
import BottomNav from "@/components/BottomNav";

export default function Favorites() {
  const navigate = useNavigate();
  const { items, remove, clear } = useFavoritesStore();
  const createTab = useTabsStore((s) => s.createTab);
  const recordHistory = useHistoryStore((s) => s.record);
  const [q, setQ] = useState("");

  const filtered = q
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(q.toLowerCase()) ||
          i.url.toLowerCase().includes(q.toLowerCase()),
      )
    : items;

  function open(url: string, title: string) {
    createTab(url, title);
    recordHistory({ title, url });
    navigate("/browser");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/5 bg-ink-950/80 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="btn-ghost h-9 w-9 p-0">
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-display text-base font-semibold">
          收藏 <span className="text-ink-500">({items.length})</span>
        </h2>
        {items.length > 0 && (
          <button
            onClick={() => confirm("清空所有收藏？") && clear()}
            className="btn-ghost ml-auto text-red-300"
          >
            <Trash2 size={14} /> 清空
          </button>
        )}
      </div>

      {/* 搜索 */}
      <div className="border-b border-white/5 bg-ink-950/40 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full border border-white/10 bg-ink-900/60 px-3 py-2">
          <Search size={14} className="text-ink-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索收藏"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-500 outline-none"
          />
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <Star size={32} className="text-ink-600" />
              <p className="text-sm text-ink-400">
                {items.length === 0
                  ? "还没有收藏，浏览时点击星标按钮即可加入"
                  : "未匹配到任何收藏"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filtered.map((item, i) => (
                <div
                  key={item.id}
                  className="group flex animate-fade-up items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/5"
                  style={{ animationDelay: `${0.03 * i}s` }}
                >
                  <img
                    src={getFaviconUrl(item.url)}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.visibility =
                        "hidden";
                    }}
                  />
                  <button
                    onClick={() => open(item.url, item.title)}
                    className="flex min-w-0 flex-1 flex-col items-start"
                  >
                    <span className="truncate text-sm font-medium text-ink-100">
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
                    className="rounded p-1.5 text-ink-500 hover:bg-white/10 hover:text-ink-200"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => remove(item.id)}
                    className="rounded p-1.5 text-ink-500 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
