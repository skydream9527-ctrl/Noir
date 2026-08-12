import { useEffect, useRef, useState } from "react";
import { Search, ArrowRight, ChevronDown } from "lucide-react";
import { ENGINES, getEngineByName } from "@/data/engines";
import { resolveQueryToUrl } from "@/utils/url";
import { useSettingsStore } from "@/store/useSettingsStore";
import { cn } from "@/lib/utils";

type Props = {
  onNavigate: (url: string, title?: string) => void;
  autoFocus?: boolean;
  compact?: boolean;
  initialQuery?: string;
};

export default function SearchBar({
  onNavigate,
  autoFocus,
  compact,
  initialQuery = "",
}: Props) {
  const defaultEngine = useSettingsStore((s) => s.defaultEngine);
  const setDefaultEngine = useSettingsStore((s) => s.setDefaultEngine);
  const [engineName, setEngineName] = useState(defaultEngine);
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEngineName(defaultEngine);
  }, [defaultEngine]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const engine = getEngineByName(engineName);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const url = resolveQueryToUrl(q, engine.searchUrl);
    onNavigate(url, q);
    setQuery("");
  }

  function pickEngine(name: string) {
    setEngineName(name);
    setDefaultEngine(name);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "group relative flex items-center gap-2 rounded-full border border-white/10 bg-ink-900/60 backdrop-blur-xl transition-all",
          "focus-within:border-neon-pink/50 focus-within:shadow-glow",
          compact ? "px-3 py-2" : "px-4 py-3",
        )}
      >
        {/* 引擎选择 */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex shrink-0 items-center gap-1.5 rounded-full pl-1 pr-2 py-1 transition-colors hover:bg-white/5"
          aria-label="选择搜索引擎"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${engine.color}, ${engine.color}dd)`,
              boxShadow: `0 4px 12px -4px ${engine.color}99`,
            }}
          >
            {engine.letter}
          </span>
          <ChevronDown
            size={14}
            className={cn(
              "text-ink-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索或输入网址"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-ink-50 placeholder:text-ink-500 outline-none",
            compact ? "text-sm" : "text-base",
          )}
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-full px-2 py-1 text-xs text-ink-400 hover:text-ink-200"
          >
            清除
          </button>
        )}

        <button
          type="submit"
          aria-label="搜索"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full text-white transition-all",
            compact ? "h-8 w-8" : "h-10 w-10",
            query.trim()
              ? "bg-neon-gradient shadow-glow hover:scale-105"
              : "bg-white/5 text-ink-500",
          )}
        >
          {compact ? <Search size={16} /> : <ArrowRight size={18} />}
        </button>
      </form>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-20 mt-2 animate-scale-in rounded-2xl border border-white/10 bg-ink-900/95 p-2 backdrop-blur-xl shadow-card">
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-4">
              {ENGINES.map((e) => (
                <button
                  key={e.name}
                  type="button"
                  onClick={() => pickEngine(e.name)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors",
                    e.name === engineName
                      ? "bg-white/10"
                      : "hover:bg-white/5",
                  )}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: e.color }}
                  >
                    {e.letter}
                  </span>
                  <span className="truncate text-xs text-ink-200">
                    {e.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
