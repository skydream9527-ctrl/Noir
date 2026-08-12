import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ShieldOff,
  Gauge,
  Globe,
  Sun,
  Moon,
  BookOpen,
  Trash2,
  ChevronRight,
  Info,
} from "lucide-react";
import { ENGINES } from "@/data/engines";
import { useSettingsStore, type Theme } from "@/store/useSettingsStore";
import { useBookmarksStore } from "@/store/useBookmarksStore";
import { useHistoryStore } from "@/store/useHistoryStore";
import { useFavoritesStore } from "@/store/useFavoritesStore";
import { useTabsStore } from "@/store/useTabsStore";
import { getRulesCount } from "@/utils/adblock";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "dark", label: "深色", icon: Moon },
  { value: "light", label: "浅色", icon: Sun },
  { value: "sepia", label: "护眼", icon: BookOpen },
];

export default function Settings() {
  const navigate = useNavigate();
  const s = useSettingsStore();
  const clearBookmarks = useBookmarksStore((st) => st.clear);
  const clearHistory = useHistoryStore((st) => st.clear);
  const clearFavorites = useFavoritesStore((st) => st.clear);
  const clearTabs = useTabsStore((st) => st.closeAll);

  function clearAllData() {
    if (!confirm("确定要清空所有本地数据（标签、书签、历史、收藏、设置）吗？")) return;
    clearBookmarks();
    clearHistory();
    clearFavorites();
    clearTabs();
    s.clearAll();
    alert("已清空全部本地数据");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/5 bg-ink-950/80 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="btn-ghost h-9 w-9 p-0">
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-display text-base font-semibold">设置</h2>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl space-y-6 px-5 py-6">
          {/* 通用 */}
          <Section title="通用" icon={Search}>
            <Row label="默认搜索引擎" desc="首页与地址栏的默认引擎">
              <select
                value={s.defaultEngine}
                onChange={(e) => s.setDefaultEngine(e.target.value)}
                className="rounded-lg border border-white/10 bg-ink-900/60 px-3 py-1.5 text-sm text-ink-100 outline-none focus:border-neon-pink/50"
              >
                {ENGINES.map((e) => (
                  <option key={e.name} value={e.name} className="bg-ink-900">
                    {e.name}
                  </option>
                ))}
              </select>
            </Row>

            <Row label="主题" desc="切换深色 / 浅色 / 护眼">
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/60 p-1">
                {themeOptions.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      onClick={() => s.setTheme(t.value)}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors",
                        s.theme === t.value
                          ? "bg-neon-gradient text-white shadow-glow"
                          : "text-ink-400 hover:bg-white/5",
                      )}
                    >
                      <Icon size={12} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </Row>
          </Section>

          {/* 广告拦截 */}
          <Section title="广告拦截" icon={ShieldOff}>
            <ToggleRow
              label="启用广告拦截"
              desc="拦截广告/追踪域名的顶层导航；阅读模式抓取时移除广告 DOM 元素"
              icon={ShieldOff}
              checked={s.adBlockEnabled}
              onToggle={s.toggleAdBlock}
            />
            <Row
              label="规则统计"
              desc="复用原 Android 项目的 EasyList 子集规则"
            >
              <span className="font-mono text-xs text-ink-300">
                DNS {getRulesCount().dns} · CSS {getRulesCount().cosmetic}
              </span>
            </Row>
            <div className="px-3 py-2 text-xs text-ink-500">
              <p>
                顶层导航命中黑名单时阻止加载并提示；阅读模式在解析 HTML 前先用 CSS 选择器移除广告元素；启用代理后，代理服务器还会在 HTML 响应中注入隐藏样式表。
              </p>
            </div>
          </Section>

          {/* 增强（演示） */}
          <Section title="浏览增强（UI 演示）" icon={Gauge}>
            <ToggleRow
              label="网页加速"
              desc="原 Android 端基于 WebView 的数据压缩能力，Web 端不适用"
              icon={Gauge}
              checked={s.speedUpEnabled}
              onToggle={s.toggleSpeedUp}
            />
          </Section>

          {/* 代理 */}
          <Section title="代理服务" icon={Globe}>
            <ToggleRow
              label="启用嵌入代理"
              desc="通过本地或部署的代理转发请求，移除 X-Frame-Options，让被拦截站点可在 iframe 中显示"
              icon={Globe}
              checked={s.proxyEnabled}
              onToggle={() => s.setProxyEnabled(!s.proxyEnabled)}
            />
            <Row label="代理地址" desc="本地启动 node server/proxy.mjs 后默认 http://localhost:8787">
              <input
                value={s.proxyBaseUrl}
                onChange={(e) => s.setProxyBaseUrl(e.target.value)}
                placeholder="http://localhost:8787"
                className="w-56 rounded-lg border border-white/10 bg-ink-900/60 px-3 py-1.5 font-mono text-xs text-ink-100 outline-none focus:border-neon-cyan/50"
              />
            </Row>
            <div className="px-3 py-2 text-xs text-ink-500">
              <p>
                启动方式：<code className="rounded bg-white/5 px-1 py-0.5">node server/proxy.mjs</code>
              </p>
              <p className="mt-1">
                生产部署：<code className="rounded bg-white/5 px-1 py-0.5">cd worker &amp;&amp; pnpm run deploy</code>（Cloudflare Worker）
              </p>
            </div>
          </Section>

          {/* 数据 */}
          <Section title="数据" icon={Trash2}>
            <button
              onClick={clearAllData}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-red-500/5"
            >
              <div>
                <div className="text-sm font-medium text-red-300">
                  清空全部本地数据
                </div>
                <div className="mt-0.5 text-xs text-ink-500">
                  包括标签、书签、历史、收藏与设置
                </div>
              </div>
              <ChevronRight size={16} className="text-ink-500" />
            </button>
          </Section>

          {/* 关于 */}
          <Section title="关于" icon={Info}>
            <div className="space-y-3 px-3 py-3 text-xs text-ink-400">
              <div className="flex items-center gap-3">
                <Logo size={40} className="rounded-lg" />
                <div>
                  <div className="font-display text-sm font-semibold text-ink-100">
                    Noir Web
                  </div>
                  <div className="text-ink-500">暗黑美学多标签浏览器</div>
                </div>
              </div>
              <Row label="版本" desc="">
                <span className="font-mono text-ink-300">v1.0.0-web</span>
              </Row>
              <Row label="来源" desc="">
                <span className="text-ink-300">原 Android Kotlin 项目重构</span>
              </Row>
              <p className="pt-2 text-ink-500">
                Noir Web 保留原项目的暗黑美学与核心交互，将 Web 端无法实现的能力（SpeedUp 数据压缩、Video PiP 增强、AdBlock 真实拦截）转换为 UI 演示或交给浏览器原生能力。
              </p>
            </div>
          </Section>

          <p
            className="animate-fade-in pb-4 text-center text-xs text-ink-600"
            style={{ animationDelay: "0.3s" }}
          >
            🖤 Noir Web · 暗黑美学
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Search;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-1">
        <Icon size={14} className="text-neon-pink" />
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-ink-400">
          {title}
        </h3>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] divide-y divide-white/5">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink-100">{label}</div>
        {desc && <div className="mt-0.5 text-xs text-ink-500">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  icon: Icon,
  checked,
  onToggle,
}: {
  label: string;
  desc: string;
  icon: typeof Search;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <Icon size={16} className="mt-0.5 text-ink-400" />
        <div>
          <div className="text-sm font-medium text-ink-100">{label}</div>
          <div className="mt-0.5 text-xs text-ink-500">{desc}</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-neon-gradient" : "bg-white/10",
        )}
        aria-pressed={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}
