import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Sun,
  Moon,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { fetchArticle, type ParsedArticle } from "@/utils/readingParser";
import { useSettingsStore, type Theme } from "@/store/useSettingsStore";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "dark", label: "深色", icon: Moon },
  { value: "light", label: "浅色", icon: Sun },
  { value: "sepia", label: "护眼", icon: BookOpen },
];

export default function Reading() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialUrl = params.get("url") || "";

  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const fontSize = useSettingsStore((s) => s.readingFontSize);
  const setFontSize = useSettingsStore((s) => s.setReadingFontSize);

  const [input, setInput] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [article, setArticle] = useState<ParsedArticle | null>(null);

  async function extract() {
    const v = input.trim();
    if (!v) return;
    setLoading(true);
    setError(null);
    setArticle(null);
    try {
      const a = await fetchArticle(v);
      setArticle(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析失败");
    } finally {
      setLoading(false);
    }
  }

  // 自动加载 URL 参数
  useEffect(() => {
    if (initialUrl) {
      extract();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  return (
    <div className="flex h-full flex-col">
      {/* 顶栏 */}
      <div className="flex items-center gap-2 border-b border-white/5 bg-ink-950/80 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="btn-ghost h-9 w-9 p-0">
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-display text-base font-semibold">阅读模式</h2>
        <div className="flex-1" />
        {article && (
          <>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/60 px-1 py-1">
              <button
                onClick={() => setFontSize(fontSize - 2)}
                className="rounded-full p-1.5 hover:bg-white/5"
                aria-label="字号减小"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center text-xs text-ink-300">
                {fontSize}
              </span>
              <button
                onClick={() => setFontSize(fontSize + 2)}
                className="rounded-full p-1.5 hover:bg-white/5"
                aria-label="字号增大"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/60 p-1">
              {themeOptions.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "rounded-full p-1.5 transition-colors",
                      theme === t.value
                        ? "bg-neon-gradient text-white shadow-glow"
                        : "text-ink-400 hover:bg-white/5",
                    )}
                    aria-label={t.label}
                  >
                    <Icon size={14} />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto">
        {!article && !loading && !error && (
          <div className="mx-auto max-w-2xl px-5 py-12">
            <div className="text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-neon-gradient text-3xl shadow-glow">
                📖
              </div>
              <h1 className="font-display text-2xl font-bold text-ink-50">
                阅读模式
              </h1>
              <p className="mt-2 text-sm text-ink-400">
                粘贴文章 URL，自动提取正文，去除干扰元素
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="粘贴 URL，或直接粘贴文章文本…"
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-ink-900/60 p-4 text-sm text-ink-100 placeholder:text-ink-500 outline-none focus:border-neon-pink/50 focus:shadow-glow"
              />
              <button
                onClick={extract}
                disabled={!input.trim()}
                className={cn(
                  "btn-primary w-full justify-center",
                  !input.trim() && "opacity-50",
                )}
              >
                <BookOpen size={16} /> 提取正文
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-ink-400">
              <p className="mb-2 font-semibold text-ink-300">提示</p>
              <ul className="list-inside list-disc space-y-1.5">
                <li>支持大多数博客、新闻、文档类站点</li>
                <li>通过公共 CORS 代理抓取，部分站点可能失败</li>
                <li>也可直接粘贴文章纯文本，自动按段落解析</li>
              </ul>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-neon-pink" />
            <p className="text-sm text-ink-400">正在抓取与解析…</p>
          </div>
        )}

        {error && !loading && (
          <div className="mx-auto max-w-2xl px-5 py-16">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <AlertCircle
                size={32}
                className="mx-auto mb-3 text-red-400"
              />
              <p className="font-display font-semibold text-red-200">
                解析失败
              </p>
              <p className="mt-1 text-sm text-ink-400">{error}</p>
              <button onClick={extract} className="btn-primary mt-4">
                重试
              </button>
            </div>
          </div>
        )}

        {article && !loading && (
          <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl px-5 py-10"
          >
            <header className="mb-8 border-b border-white/5 pb-6">
              <h1 className="font-display text-3xl font-bold leading-tight text-ink-50">
                {article.title}
              </h1>
              {article.excerpt && (
                <p className="mt-3 text-sm text-ink-400">
                  {article.excerpt}
                </p>
              )}
              <div className="mt-4 flex items-center gap-3 text-xs text-ink-500">
                <span className="chip">
                  {article.wordCount.toLocaleString()} 字符
                </span>
              </div>
            </header>
            <div
              className="reading-content"
              style={{
                fontSize: `${fontSize}px`,
                color: "var(--reading-text, #f8fafc)",
              }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </motion.article>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
