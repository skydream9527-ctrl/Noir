import { List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TocItem } from "@/utils/readingParser";

type Props = {
  items: TocItem[];
  activeId: string | null;
  onJump: (id: string) => void;
};

/**
 * 阅读模式侧栏目录。
 */
export default function TableOfContents({ items, activeId, onJump }: Props) {
  if (items.length === 0) return null;

  return (
    <nav className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <List size={13} className="text-neon-cyan" />
        <h4 className="font-display text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          目录
        </h4>
        <span className="ml-auto text-[10px] text-ink-500">
          {items.length} 节
        </span>
      </div>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it.id}>
            <button
              onClick={() => onJump(it.id)}
              className={cn(
                "block w-full truncate rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                it.level === 3 && "pl-5",
                activeId === it.id
                  ? "bg-neon-pink/10 text-neon-pink"
                  : "text-ink-400 hover:bg-white/5 hover:text-ink-200",
              )}
            >
              {it.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
