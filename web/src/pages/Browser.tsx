import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Bookmark, Star, ExternalLink, X } from "lucide-react";
import AddressBar from "@/components/AddressBar";
import Drawer from "@/components/Drawer";
import BottomNav from "@/components/BottomNav";
import { useTabsStore } from "@/store/useTabsStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useBookmarksStore } from "@/store/useBookmarksStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getDomain } from "@/utils/url";

export default function Browser() {
  const navigate = useNavigate();
  const tabs = useTabsStore((s) => s.tabs);
  const activeId = useTabsStore((s) => s.activeId);
  const createTab = useTabsStore((s) => s.createTab);
  const closeTab = useTabsStore((s) => s.closeTab);
  const setActive = useTabsStore((s) => s.setActive);
  const updateTab = useTabsStore((s) => s.updateTab);

  const recordHistory = useHistoryStore((s) => s.record);
  const addBookmark = useBookmarksStore((s) => s.add);
  const addFavorite = useFavoritesStore((s) => s.add);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const active = tabs.find((t) => t.id === activeId) ?? null;
  const activeIndex = useMemo(
    () => tabs.findIndex((t) => t.id === activeId),
    [tabs, activeId],
  );

  // 标签会话由 useTabsStore 的 persist 自动恢复；
  // 这里仅在没有标签且首次访问时给出 EmptyState，不再强制打开百度。

  const handleNewTab = useCallback(() => {
    createTab("about:blank", "新标签");
  }, [createTab]);

  const handleCloseTab = useCallback(() => {
    if (activeId) closeTab(activeId);
  }, [activeId, closeTab]);

  const handleNextTab = useCallback(() => {
    if (tabs.length < 2) return;
    const next = tabs[(activeIndex + 1) % tabs.length];
    setActive(next.id);
  }, [tabs, activeIndex, setActive]);

  const handlePrevTab = useCallback(() => {
    if (tabs.length < 2) return;
    const prev = tabs[(activeIndex - 1 + tabs.length) % tabs.length];
    setActive(prev.id);
  }, [tabs, activeIndex, setActive]);

  const handleFocusAddress = useCallback(() => {
    const el = document.getElementById("noir-address-input") as HTMLInputElement | null;
    el?.focus();
    el?.select();
  }, []);

  const handleBlurAddress = useCallback(() => {
    const el = document.getElementById("noir-address-input") as HTMLInputElement | null;
    el?.blur();
  }, []);

  useKeyboardShortcuts({
    onNewTab: handleNewTab,
    onCloseTab: handleCloseTab,
    onPrevTab: handlePrevTab,
    onNextTab: handleNextTab,
    onFocusAddress: handleFocusAddress,
    onBlurAddress: handleBlurAddress,
  });

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
          className="btn-ghost h-9 px-2"
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
              className="btn-ghost h-9 px-2"
            >
              <Bookmark size={15} />
              <span className="hidden sm:inline">书签</span>
            </button>
            {/* 收藏和新窗口在小屏幕隐藏，减少工具栏拥挤 */}
            <button
              onClick={() =>
                addFavorite({ title: active.title, url: active.url })
              }
              className="btn-ghost hidden h-9 px-2 sm:inline-flex"
            >
              <Star size={15} />
              <span className="hidden md:inline">收藏</span>
            </button>
            <button
              onClick={() =>
                navigate(`/reading?url=${encodeURIComponent(active.url)}`)
              }
              className="btn-ghost h-9 px-2"
            >
              <BookOpen size={15} />
              <span className="hidden sm:inline">阅读模式</span>
            </button>
            <a
              href={active.url}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost hidden h-9 px-2 sm:inline-flex"
            >
              <ExternalLink size={15} />
              <span className="hidden md:inline">新窗口</span>
            </a>
          </>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <AddressBar
          onGoHome={() => navigate("/")}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenReadingMode={(url) =>
            navigate(`/reading?url=${encodeURIComponent(url)}`)
          }
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
