import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTabsStore, type Tab } from "@/store/useTabsStore";

type Props = {
  onGoHome: () => void;
  onOpenDrawer: () => void;
};

export default function AddressBar({ onGoHome, onOpenDrawer }: Props) {
  const {
    tabs,
    activeId,
    setActive,
    createTab,
    closeTab,
    updateTab,
  } = useTabsStore();
  const active = tabs.find((t) => t.id === activeId) ?? null;

  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function commitUrl() {
    if (!active) return;
    const q = draft.trim();
    if (!q) return;
    // 简化：直接当作 URL
    let url = q;
    if (!/^https?:\/\//i.test(url)) {
      if (/^[\w-]+(\.[\w-]+)+/.test(url)) url = `https://${url}`;
      else url = `https://www.baidu.com/s?wd=${encodeURIComponent(url)}`;
    }
    updateTab(active.id, { url });
    setDraft("");
    setLoading(true);
  }

  function reload() {
    if (iframeRef.current) {
      setLoading(true);
      // 重新设置 src 触发刷新
      const src = iframeRef.current.src;
      iframeRef.current.src = "about:blank";
      requestAnimationFrame(() => {
        if (iframeRef.current) iframeRef.current.src = src;
      });
    }
  }

  return (
    <div className="flex h-full flex-col border-b border-white/5 bg-ink-950/80 backdrop-blur-xl">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          className="btn-ghost h-9 w-9 p-0"
          onClick={() => window.history.back()}
          aria-label="后退"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          className="btn-ghost h-9 w-9 p-0"
          onClick={() => window.history.forward()}
          aria-label="前进"
        >
          <ArrowRight size={16} />
        </button>
        <button
          className="btn-ghost h-9 w-9 p-0"
          onClick={reload}
          aria-label="刷新"
        >
          <RotateCw size={16} className={cn(loading && "animate-spin")} />
        </button>

        {/* 地址栏 */}
        <div className="mx-2 flex flex-1 items-center gap-2 rounded-full border border-white/10 bg-ink-900/70 px-3 py-1.5">
          <input
            value={draft || active?.url || ""}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setDraft(active?.url || "")}
            onBlur={() => setDraft("")}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitUrl();
            }}
            placeholder="搜索或输入网址"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink-100 placeholder:text-ink-500 outline-none"
          />
          {loading && (
            <Loader2 size={14} className="animate-spin text-neon-cyan" />
          )}
        </div>

        <button
          className="btn-ghost h-9 w-9 p-0"
          onClick={() => createTab("about:blank", "新标签")}
          aria-label="新建标签"
        >
          <Plus size={16} />
        </button>
        <button
          className="btn-ghost h-9 w-9 p-0"
          onClick={onOpenDrawer}
          aria-label="书签历史"
        >
          <Home size={16} />
        </button>
        <button
          className="btn-ghost h-9 w-9 p-0"
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

      {/* iframe 内容区 */}
      <div className="relative flex-1 overflow-hidden bg-ink-950">
        {tabs.length === 0 || !active ? (
          <EmptyState onCreate={() => createTab("https://www.baidu.com", "百度")} />
        ) : active.url === "about:blank" ? (
          <BlankTab />
        ) : (
          <>
            <iframe
              key={active.id}
              ref={iframeRef}
              src={active.url}
              title={active.title}
              className="h-full w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
            {/* iframe 加载失败兜底提示 */}
            <div className="pointer-events-none absolute bottom-4 right-4 hidden rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-300 backdrop-blur md:block">
              若页面空白，可能是目标站点禁止嵌入，请点击「在新窗口打开」
            </div>
          </>
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl">🖤</div>
      <div>
        <p className="font-display text-lg font-semibold text-ink-100">
          当前没有打开的标签
        </p>
        <p className="mt-1 text-sm text-ink-400">
          新建一个标签开始浏览
        </p>
      </div>
      <button onClick={onCreate} className="btn-primary">
        <Plus size={14} /> 打开百度
      </button>
    </div>
  );
}

function BlankTab() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="text-5xl opacity-60">✨</div>
      <p className="text-sm text-ink-400">
        在上方地址栏输入网址或搜索词
      </p>
    </div>
  );
}
