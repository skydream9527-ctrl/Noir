import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Settings as SettingsIcon } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import QuickAccess from "@/components/QuickAccess";
import BottomNav from "@/components/BottomNav";
import { useTabsStore } from "@/store/useTabsStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { getDomain } from "@/utils/url";

export default function Home() {
  const navigate = useNavigate();
  const createTab = useTabsStore((s) => s.createTab);
  const recordHistory = useHistoryStore((s) => s.record);

  function openUrl(url: string, title?: string) {
    createTab(url, title);
    recordHistory({ title: title || getDomain(url), url });
    navigate("/browser");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 pb-8 pt-12 sm:pt-16">
          {/* 顶部操作 */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => navigate("/reading")}
              className="btn-ghost"
            >
              <BookOpen size={16} />
              <span className="hidden sm:inline">阅读模式</span>
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="btn-ghost"
            >
              <SettingsIcon size={16} />
              <span className="hidden sm:inline">设置</span>
            </button>
          </div>

          {/* Logo 区 */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 text-center sm:mt-20"
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-ink-300">
              <Sparkles size={12} className="text-neon-pink" />
              <span>Dark Aesthetics · 暗黑美学</span>
            </div>
            <h1 className="font-display text-7xl font-extrabold tracking-tight sm:text-8xl">
              <span className="gradient-text">Noir</span>
              <span className="ml-2 text-ink-50">🖤</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-balance text-sm text-ink-400 sm:text-base">
              极简暗黑美学的多标签浏览器，聚合常用搜索与内容站点入口
            </p>
          </motion.div>

          {/* 搜索框 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-10 w-full max-w-2xl"
          >
            <SearchBar onNavigate={openUrl} autoFocus />
          </motion.div>

          {/* 快捷入口 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-400">
                快捷入口
              </h2>
              <span className="text-xs text-ink-500">
                {11} 个站点
              </span>
            </div>
            <QuickAccess onOpen={openUrl} />
          </motion.div>

          {/* 特性卡 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <FeatureCard
              title="多标签浏览"
              desc="同时打开多个站点，侧边抽屉管理书签与历史"
              accent="#ec4899"
            />
            <FeatureCard
              title="阅读模式"
              desc="粘贴 URL 自动提取正文，字号 / 主题自由切换"
              accent="#38bdf8"
            />
            <FeatureCard
              title="本地持久化"
              desc="无需登录，所有数据保存在浏览器本地"
              accent="#8b5cf6"
            />
          </motion.div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  accent,
}: {
  title: string;
  desc: string;
  accent: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05]">
      <div
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-60"
        style={{ background: accent }}
      />
      <h3 className="font-display text-base font-semibold text-ink-50">
        {title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-400">{desc}</p>
    </div>
  );
}
