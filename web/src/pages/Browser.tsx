import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Bookmark, Star, ExternalLink, X } from "lucide-react";
import AddressBar from "@/components/AddressBar";
import Drawer from "@/components/Drawer";
import BottomNav from "@/components/BottomNav";
import { useTabsStore } from "@/store/useTabsStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useBookmarksStore } from "@/store/useBookmarksStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { getDomain } from "@/utils/url";

export default function Browser() {
  const navigate = useNavigate();
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const createTab = useTabsStore((s) => s.createTab);
  const updateTab = useTabsStore((s) => s.updateTab);

  const recordHistory = useHistoryStore((s) => s.record);
  const addBookmark = useBookmarksStore((s) => s.add);
  const addFavorite = useFavoritesStore((s) => s.add);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const active = tabs.find((t) => t.id === activeId) ?? null;

  // 首次进入若无标签，自动打开百度
  useEffect(() => {
    if (tabs.length === 0) {
      createTab("https://www.baidu.com", "百度");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNavigate(url: string, title?: string) {
    if (active) {
      updateTab(active.id, { url, title: title || getDomain(url) });
    } else {
      createTab(url, title);
    }
    recordHistory({ title: title || getDomain(url), url });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-white/5 bg-ink-950/80 px-3 py-2 backdrop-blur-xl">
        <button
          onClick={() => navigate("/")}
          className="btn-ghost"
        >
          <X size={16} />
          <span className="hidden sm:inline">退出</span>
        </button>
        <div className="flex-1" />
        {active && active.url !== "about:blank" && (
          <>
            <button
              onClick={() =>
                addBookmark({ title: active.title, url: active.url })
              }
              className="btn-ghost"
            >
              <Bookmark size={15} />
              <span className="hidden sm:inline">书签</span>
            </button>
            <button
              onClick={() =>
                addFavorite({ title: active.title, url: active.url })
              }
              className="btn-ghost"
            >
              <Star size={15} />
              <span className="hidden sm:inline">收藏</span>
            </button>
            <button
              onClick={() =>
                navigate(`/reading?url=${encodeURIComponent(active.url)}`)
              }
              className="btn-ghost"
            >
              <BookOpen size={15} />
              <span className="hidden sm:inline">阅读模式</span>
            </button>
            <a
              href={active.url}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              <ExternalLink size={15} />
              <span className="hidden sm:inline">新窗口</span>
            </a>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <AddressBar
          onGoHome={() => navigate("/")}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleNavigate}
      />

      <BottomNav />
    </div>
  );
}
