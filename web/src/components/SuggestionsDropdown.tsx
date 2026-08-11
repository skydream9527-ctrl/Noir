import { Clock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDomain } from "@/utils/url";
import type { Suggestion } from "@/hooks/useSuggestions";

type Props = {
  suggestions: Suggestion[];
  activeIndex: number;
  onSelect: (s: Suggestion) => void;
  onHover: (idx: number) => void;
};

export default function SuggestionsDropdown({
  suggestions,
  activeIndex,
  onSelect,
  onHover,
}: Props) {
  if (suggestions.length === 0) return null;

  // 计算分组边界，用于在分组之间画分隔线
  let lastKind: Suggestion["kind"] | null = null;

  return (
    <div
      className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
      role="listbox"
    >
      {suggestions.map((s, idx) => {
        const showDivider = lastKind !== null && lastKind !== s.kind;
        lastKind = s.kind;
        return (
          <ItemRow
            key={`${s.kind}-${idx}`}
            suggestion={s}
            active={idx === activeIndex}
            showDivider={showDivider}
            onSelect={() => onSelect(s)}
            onHover={() => onHover(idx)}
          />
        );
      })}
    </div>
  );
}

function ItemRow({
  suggestion,
  active,
  showDivider,
  onSelect,
  onHover,
}: {
  suggestion: Suggestion;
  active: boolean;
  showDivider: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  return (
    <>
      {showDivider && <div className="my-0.5 h-px bg-white/5" />}
      <button
        type="button"
        role="option"
        aria-selected={active}
        onMouseEnter={onHover}
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
          active ? "bg-white/10 text-ink-50" : "text-ink-200 hover:bg-white/5",
        )}
      >
        <SuggestionIcon suggestion={suggestion} />
        <div className="min-w-0 flex-1">
          <div className="truncate">{primaryText(suggestion)}</div>
          <div className="truncate text-xs text-ink-500">
            {secondaryText(suggestion)}
          </div>
        </div>
      </button>
    </>
  );
}

function SuggestionIcon({ suggestion }: { suggestion: Suggestion }) {
  switch (suggestion.kind) {
    case "history":
      return <Clock size={14} className="shrink-0 text-ink-500" />;
    case "search":
      return (
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
          style={{ background: suggestion.color }}
        >
          {suggestion.letter}
        </span>
      );
    case "navigate":
      return <Globe size={14} className="shrink-0 text-neon-cyan" />;
  }
}

function primaryText(s: Suggestion): string {
  switch (s.kind) {
    case "history":
      return s.title || getDomain(s.url);
    case "search":
      return s.query;
    case "navigate":
      return s.display;
  }
}

function secondaryText(s: Suggestion): string {
  switch (s.kind) {
    case "history":
      return getDomain(s.url);
    case "search":
      return `在 ${s.engineName} 搜索`;
    case "navigate":
      return "直接访问";
  }
}
