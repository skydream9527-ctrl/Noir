import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Layers,
  Bookmark,
  History as HistoryIcon,
  Star,
  Settings as SettingsIcon,
  Moon,
  Sun,
  BookOpen,
} from "lucide-react";
import { useTabsStore } from "@/store/useTabsStore";
import { useBookmarksStore } from "@/store/useBookmarksStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useSettingsStore, type Theme } from "@/store/useSettingsStore";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";

export default function Profile() {
  const navigate = useNavigate();
  const tabCount = useTabsStore((s) => s.tabs.length);
  const bookmarkCount = useBookmarksStore((s) => s.items.length);
  const historyCount = useHistoryStore((s) => s.items.length);
  const favoriteCount = useFavoritesStore((s) => s.items.length);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const stats = [
    { label: "打开标签", value: tabCount, icon: Layers, color: "#ec4899" },
    { label: "书签", value: bookmarkCount, icon: Bookmark, color: "#38bdf8" },
    { label: "历史", value: historyCount, icon: HistoryIcon, color: "#8b5cf6" },
    { label: "收藏", value: favoriteCount, icon: Star, color: "#f59e0b" },
  ];

  const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "dark", label: "深色", icon: Moon },
    { value: "light", label: "浅色", icon: Sun },
    { value: "sepia", label: "护眼", icon: BookOpen },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/5 bg-ink-950/80 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="btn-ghost h-9 w-9 p-0">
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-display text-base font-semibold">个人中心</h2>
        <div className="flex-1" />
        <button
          onClick={() => navigate("/settings")}
          className="btn-ghost h-9 w-9 p-0"
        >
          <SettingsIcon size={16} />
        </button>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-5 py-8">
          {/* 头像 */}
          <div className="flex animate-scale-in flex-col items-center text-center">
            <div className="relative">
              <Logo size={96} className="rounded-full shadow-glow" />
              <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-ink-950 bg-neon-cyan px-2 py-0.5 text-[10px] font-bold text-ink-950">
                NOIR
              </span>
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-ink-50">
              Guest User
            </h1>
            <p className="mt-1 text-sm text-ink-400">
              匿名访问 · 数据保存在本地
            </p>
          </div>

          {/* 统计 */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="relative animate-fade-up overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <div
                    className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-2xl"
                    style={{ background: stat.color }}
                  />
                  <Icon size={18} style={{ color: stat.color }} />
                  <div className="mt-3 font-display text-2xl font-bold text-ink-50">
                    {stat.value}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-400">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 主题快速切换 */}
          <div className="mt-8">
            <h3 className="mb-3 px-1 font-display text-xs font-semibold uppercase tracking-wider text-ink-400">
              主题
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((t) => {
                const Icon = t.icon;
                const active = theme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                      active
                        ? "border-neon-pink/50 bg-neon-pink/5 shadow-glow"
                        : "border-white/5 bg-white/[0.02] hover:bg-white/5",
                    )}
                  >
                    <Icon
                      size={22}
                      className={active ? "text-neon-pink" : "text-ink-300"}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        active ? "text-ink-50" : "text-ink-400",
                      )}
                    >
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 快捷入口 */}
          <div className="mt-8">
            <h3 className="mb-3 px-1 font-display text-xs font-semibold uppercase tracking-wider text-ink-400">
              快捷入口
            </h3>
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
              <QuickLink
                label="多窗口浏览"
                desc="管理当前打开的标签"
                onClick={() => navigate("/browser")}
              />
              <QuickLink
                label="阅读模式"
                desc="提取文章正文，沉浸式阅读"
                onClick={() => navigate("/reading")}
              />
              <QuickLink
                label="设置"
                desc="搜索引擎、主题、数据管理"
                onClick={() => navigate("/settings")}
              />
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-ink-600">
            🖤 Noir Web · 暗黑美学多标签浏览器
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function QuickLink({
  label,
  desc,
  onClick,
}: {
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5"
    >
      <div>
        <div className="text-sm font-medium text-ink-100">{label}</div>
        <div className="mt-0.5 text-xs text-ink-500">{desc}</div>
      </div>
      <ArrowLeft size={16} className="rotate-180 text-ink-500" />
    </button>
  );
}
