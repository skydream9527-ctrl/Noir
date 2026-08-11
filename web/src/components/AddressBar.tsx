import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  PanelLeft,
  Plus,
  X,
  Loader2,
  ShieldOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTabsStore, type Tab } from "@/store/useTabsStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { resolveQueryToUrl, getEngineDefaultSearchUrl, isFrameBlocked, getDomain } from "@/utils/url";
import { useIframeBlock } from "@/hooks/useIframeBlock";
import { useSuggestions, type Suggestion } from "@/hooks/useSuggestions";
import { withProxy } from "@/utils/proxy";
import { shouldBlockUrl } from "@/utils/adblock";
import FrameBlocked from "@/components/FrameBlocked";
import SuggestionsDropdown from "@/components/SuggestionsDropdown";

type Props = {
  onGoHome: () => void;
  onOpenDrawer: () => void;
  onOpenReadingMode?: (url: string) => void;
};

export default function AddressBar({
  onGoHome,
  onOpenDrawer,
  onOpenReadingMode,
}: Props) {
  const { tabs, activeId, setActive, createTab, closeTab, updateTab } =
    useTabsStore();
  const active = tabs.find((t) => t.id === activeId) ?? null;
  const defaultEngine = useSettingsStore((s) => s.defaultEngine);
  const proxyEnabled = useSettingsStore((s) => s.proxyEnabled);
  const adBlockEnabled = useSettingsStore((s) => s.adBlockEnabled);

  const [draft, setDraft] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [proxyRetry, setProxyRetry] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 仅在用户实际输入或聚焦时计算建议；draft 为空且未聚焦时不展示
  const queryForSuggestions = focused ? draft : "";
  const suggestions = useSuggestions(queryForSuggestions, defaultEngine);

  // 决定 iframe 实际加载的 URL：被拦截且启用代理时走代理
  const frameUrl = useMemo(() => {
    if (!active?.url || active.url === "about:blank") return "";
    if (proxyRetry && proxyEnabled) return withProxy(active.url);
    return active.url;
  }, [active?.url, proxyRetry, proxyEnabled]);

  const { state, handleLoad } = useIframeBlock(frameUrl);
  const loading = state === "loading";
  const blocked = state === "blocked";
  const canProxy = isFrameBlocked(active?.url ?? "") && proxyEnabled;

  function commitUrl(urlOverride?: string, titleOverride?: string) {
    if (!active) return;
    const q = draft.trim();
    if (!q && !urlOverride) return;
    const url =
      urlOverride ?? resolveQueryToUrl(q, getEngineDefaultSearchUrl(defaultEngine));
    // 广告拦截：检查目标 URL 是否命中黑名单
    if (adBlockEnabled && shouldBlockUrl(url)) {
      showBlockedNotice(`已拦截广告/追踪请求：${getDomain(url)}`);
      setDraft("");
      setFocused(false);
      setActiveIdx(-1);
      return;
    }
    const title = titleOverride ?? (urlOverride ? getDomain(urlOverride) : q);
    updateTab(active.id, { url, title });
    setDraft("");
    setFocused(false);
    setActiveIdx(-1);
    setProxyRetry(false);
    setRetryKey((k) => k + 1);
  }

  function showBlockedNotice(msg: string) {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setBlockedNotice(msg);
    noticeTimer.current = setTimeout(() => setBlockedNotice(null), 3000);
  }

  function selectSuggestion(s: Suggestion) {
    if (s.kind === "history") {
      commitUrl(s.url, s.title);
    } else if (s.kind === "navigate") {
      commitUrl(s.url, s.display);
    } else {
      // search
      commitUrl(s.url, `${s.engineName} - ${s.query}`);
    }
  }

  function reload() {
    setProxyRetry(false);
    setRetryKey((k) => k + 1);
  }

  function retryWithProxy() {
    setProxyRetry(true);
    setRetryKey((k) => k + 1);
  }

  function handleInputFocus() {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setFocused(true);
    setDraft(active?.url && active.url !== "about:blank" ? active.url : "");
    setActiveIdx(-1);
  }

  function handleInputBlur() {
    // 延迟关闭下拉框，让点击事件有时间触发
    blurTimer.current = setTimeout(() => {
      setFocused(false);
      setDraft("");
      setActiveIdx(-1);
    }, 150);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (focused && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((idx) =>
          idx >= suggestions.length - 1 ? 0 : idx + 1,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((idx) =>
          idx <= 0 ? suggestions.length - 1 : idx - 1,
        );
        return;
      }
      if (e.key === "Enter") {
        if (activeIdx >= 0 && activeIdx < suggestions.length) {
          e.preventDefault();
          selectSuggestion(suggestions[activeIdx]);
          return;
        }
      }
    }
    if (e.key === "Enter") commitUrl();
    if (e.key === "Escape") {
      setFocused(false);
      setActiveIdx(-1);
      (e.target as HTMLInputElement).blur();
    }
  }

  return (
    <div className="flex h-full flex-col border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-2 py-2 sm:px-3 sm:gap-1">
        <button
          className="btn-ghost h-8 w-8 p-0 sm:h-9 sm:w-9"
          onClick={() => window.history.back()}
          aria-label="后退"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          className="btn-ghost hidden h-9 w-9 p-0 sm:inline-flex"
          onClick={() => window.history.forward()}
          aria-label="前进"
        >
          <ArrowRight size={16} />
        </button>
        <button
          className="btn-ghost h-8 w-8 p-0 sm:h-9 sm:w-9"
          onClick={reload}
          aria-label="刷新"
        >
          <RotateCw size={16} className={cn(loading && "animate-spin")} />
        </button>

        {/* 地址栏 */}
        <div className="relative mx-1 flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-ink-900/70 px-3 py-1.5 sm:mx-2">
          <input
            id="noir-address-input"
            value={draft || active?.url || ""}
            onChange={(e) => {
              setDraft(e.target.value);
              setActiveIdx(-1);
            }}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder="搜索或输入网址"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-500 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <Loader2 size={14} className="animate-spin text-neon-cyan" />
          )}
          {focused && suggestions.length > 0 && (
            <SuggestionsDropdown
              suggestions={suggestions}
              activeIndex={activeIdx}
              onSelect={(s) => {
                if (blurTimer.current) {
                  clearTimeout(blurTimer.current);
                  blurTimer.current = null;
                }
                selectSuggestion(s);
              }}
              onHover={(idx) => setActiveIdx(idx)}
            />
          )}
        </div>

        <button
          className="btn-ghost h-8 w-8 p-0 sm:h-9 sm:w-9"
          onClick={() => createTab("about:blank", "新标签")}
          aria-label="新建标签"
        >
          <Plus size={16} />
        </button>
        <button
          className="btn-ghost h-8 w-8 p-0 sm:h-9 sm:w-9"
          onClick={onOpenDrawer}
          aria-label="书签历史"
        >
          <PanelLeft size={16} />
        </button>
        {/* 返回主页按钮在小屏幕隐藏，由 BottomNav 替代 */}
        <button
          className="btn-ghost hidden h-9 w-9 p-0 sm:inline-flex"
          onClick={onGoHome}
          aria-label="返回主页"
        >
          <X size={16} />
        </button>
      </div>

      {/* 标签栏 */}
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto px-2 pb-2">
        {tabs.length === 0 && (
          <button
            onClick={() => createTab("about:blank", "新标签")}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/10 px-3 py-1.5 text-xs text-ink-400 hover:bg-white/5"
          >
            <Plus size={12} /> 新建标签
          </button>
        )}
        {tabs.map((tab) => (
          <TabChip
            key={tab.id}
            tab={tab}
            active={tab.id === activeId}
            onClick={() => setActive(tab.id)}
            onClose={() => closeTab(tab.id)}
          />
        ))}
      </div>

      {/* 加载进度条 */}
      {loading && (
        <div className="relative h-0.5 w-full overflow-hidden bg-transparent">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="h-full w-1/3 bg-neon-gradient"
          />
        </div>
      )}

      {/* 广告拦截提示 */}
      {blockedNotice && (
        <div className="flex items-center gap-2 border-b border-neon-pink/20 bg-neon-pink/10 px-4 py-2 text-xs text-neon-pink">
          <ShieldOff size={12} className="shrink-0" />
          <span className="flex-1 truncate">{blockedNotice}</span>
          <button
            onClick={() => setBlockedNotice(null)}
            className="rounded p-0.5 hover:bg-white/10"
            aria-label="关闭"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 内容区 */}
      <div className="relative flex-1 overflow-hidden bg-ink-950">
        {tabs.length === 0 || !active ? (
          <EmptyState
            onCreate={() => createTab("about:blank", "新标签")}
            onOpenBaidu={() => createTab("https://www.baidu.com", "百度")}
          />
        ) : active.url === "about:blank" ? (
          <BlankTab />
        ) : blocked ? (
          <FrameBlocked
            url={active.url}
            onRetry={reload}
            onRetryWithProxy={canProxy ? retryWithProxy : undefined}
            onReadingMode={
              onOpenReadingMode
                ? () => onOpenReadingMode(active.url)
                : undefined
            }
            reason="pre-blocked"
          />
        ) : (
          <iframe
            key={`${active.id}-${retryKey}-${proxyRetry}`}
            id="noir-frame"
            ref={iframeRef}
            src={frameUrl}
            title={active.title}
            className="h-full w-full border-0 bg-white animate-fade-in"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            onLoad={handleLoad}
          />
        )}
      </div>
    </div>
  );
}

function TabChip({
  tab,
  active,
  onClick,
  onClose,
}: {
  tab: Tab;
  active: boolean;
  onClick: () => void;
  onClose: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all",
        active
          ? "border-white/15 bg-white/10 text-ink-50"
          : "border-transparent text-ink-400 hover:bg-white/5",
      )}
      style={active ? { boxShadow: "inset 2px 0 0 #ec4899" } : undefined}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          background: active ? "#ec4899" : "rgba(148,163,184,0.4)",
        }}
      />
      <span className="max-w-[120px] truncate">{tab.title || "新标签"}</span>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
      >
        <X size={11} />
      </span>
    </button>
  );
}

function EmptyState({
  onCreate,
  onOpenBaidu,
}: {
  onCreate: () => void;
  onOpenBaidu: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl">🖤</div>
      <div>
        <p className="font-display text-lg font-semibold text-ink-100">
          当前没有打开的标签
        </p>
        <p className="mt-1 text-sm text-ink-400">
          新建空白标签开始浏览，或直接打开百度
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onCreate} className="btn-primary">
          <Plus size={14} /> 新建标签
        </button>
        <button onClick={onOpenBaidu} className="btn-ghost">
          打开百度
        </button>
      </div>
    </div>
  );
}

function BlankTab() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="text-5xl opacity-60">✨</div>
      <p className="text-sm text-ink-400">在上方地址栏输入网址或搜索词</p>
    </div>
  );
}
