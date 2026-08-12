import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Minus,
  Plus,
  Sun,
  Moon,
  BookOpen,
  AlertCircle,
  Clock,
  Hash,
  List,
  X,
} from "lucide-react";
import {
  fetchArticle,
  injectTocIds,
  type ParsedArticle,
} from "@/utils/readingParser";
import { useSettingsStore, type Theme } from "@/store/useSettingsStore";
import { cn } from "@/lib/utils";
import BottomNav from "@/components/BottomNav";
import TableOfContents from "@/components/TableOfContents";
import { useReadingProgress, useActiveHeading } from "@/hooks/useReadingProgress";

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
  const [tocOpen, setTocOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const progress = useReadingProgress(scrollRef);
  const tocIds = useMemo(() => article?.toc.map((t) => t.id) ?? [], [article]);
  const activeId = useActiveHeading(scrollRef, tocIds);

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

  useEffect(() => {
    if (initialUrl) extract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  // 注入 TOC id 后的正文
  const renderedContent = useMemo(() => {
    if (!article) return "";
    return injectTocIds(article.content, article.toc);
  }, [article]);

  function jumpToHeading(id: string) {
    const container = scrollRef.current;
    if (!container) return;
    const node = container.querySelector(`#${CSS.escape(id)}`);
    if (node) {
      const offset = (node as HTMLElement).offsetTop - container.offsetTop - 20;
      container.scrollTo({ top: offset, behavior: "smooth" });
    }
  }

  function jumpAndClose(id: string) {
    jumpToHeading(id);
    setTocOpen(false);
  }

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

      {/* 阅读进度条 */}
      {article && (
        <div className="h-1 w-full bg-ink-900">
          <div
            className="h-full bg-neon-gradient transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div
        ref={scrollRef}
        className="no-scrollbar flex-1 overflow-y-auto"
      >
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
                <li>使用 Mozilla Readability 算法，与 Firefox 阅读视图同源</li>
                <li>自动生成目录大纲、阅读进度与预估时长</li>
                <li>通过代理抓取，部分站点可能失败</li>
                <li>也可直接粘贴文章纯文本，自动按段落解析</li>
              </ul>
            </div>
          </div>
        )}

        {loading && <ReadingSkeleton />}

        {error && !loading && (
          <div className="mx-auto max-w-2xl px-5 py-16">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-red-400" />
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
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-10 lg:grid-cols-[1fr_220px]">
            <article className="mx-auto w-full animate-fade-up max-w-2xl">
              <header className="mb-8 border-b border-white/5 pb-6">
                <h1 className="font-display text-3xl font-bold leading-tight text-ink-50">
                  {article.title}
                </h1>
                {article.excerpt && (
                  <p className="mt-3 text-sm text-ink-400">
                    {article.excerpt}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                  <span className="chip">
                    <Hash size={11} />
                    {article.wordCount.toLocaleString()} 字符
                  </span>
                  <span className="chip">
                    <Clock size={11} />
                    约 {article.readingMinutes} 分钟
                  </span>
                  {article.byline && (
                    <span className="chip">{article.byline}</span>
                  )}
                </div>
              </header>
              <div
                className="reading-content"
                style={{
                  fontSize: `${fontSize}px`,
                  color: "var(--reading-text, #f8fafc)",
                }}
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />
            </article>

            {/* TOC 侧栏（桌面） */}
            <aside className="hidden lg:block">
              <div className="sticky top-4">
                <TableOfContents
                  items={article.toc}
                  activeId={activeId}
                  onJump={jumpToHeading}
                />
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* 移动端 TOC 浮动按钮 */}
      {article && article.toc.length > 0 && (
        <button
          onClick={() => setTocOpen(true)}
          className="fixed bottom-20 right-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full bg-neon-gradient text-white shadow-glow lg:hidden"
          aria-label="打开目录"
        >
          <List size={18} />
        </button>
      )}

      {/* 移动端 TOC 抽屉 */}
      {tocOpen && article && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setTocOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 h-full w-72 max-w-[80%] overflow-y-auto border-l border-white/10 bg-ink-950 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-ink-200">
                目录
              </h3>
              <button
                onClick={() => setTocOpen(false)}
                className="rounded-full p-1.5 hover:bg-white/10"
                aria-label="关闭目录"
              >
                <X size={16} />
              </button>
            </div>
            <TableOfContents
              items={article.toc}
              activeId={activeId}
              onJump={jumpAndClose}
            />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

/** 加载骨架 */
function ReadingSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-3/4 animate-pulse rounded-lg bg-white/5" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
        <div className="flex gap-2">
          <div className="h-5 w-20 animate-pulse rounded-full bg-white/5" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-white/5" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-white/5"
            style={{ width: `${80 + (i % 3) * 10}%` }}
          />
        ))}
        <div className="h-4 w-2/3 animate-pulse rounded bg-white/5" />
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-white/5"
            style={{ width: `${70 + (i % 4) * 8}%` }}
          />
        ))}
      </div>
    </div>
  );
}
