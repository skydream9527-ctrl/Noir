import { useMemo } from "react";
import { ENGINES } from "@/data/engines";
import { useHistoryStore } from "@/store/useHistoryStore";
import { isUrl, normalizeUrl, buildSearchUrl } from "@/utils/url";

export type Suggestion =
  | {
      kind: "history";
      title: string;
      url: string;
      visitedAt: number;
    }
  | {
      kind: "search";
      engineName: string;
      query: string;
      url: string;
      color: string;
      letter: string;
    }
  | {
      kind: "navigate";
      url: string;
      display: string;
    };

const MAX_HISTORY_SUGGESTIONS = 4;
const MAX_RECENT_WHEN_EMPTY = 5;
// 当输入搜索词时，额外展示几个引擎建议（在默认引擎之外）
const EXTRA_ENGINE_INDICES = [2, 5]; // 必应、知乎

/**
 * 根据地址栏输入计算建议列表。
 * - 输入为空：返回最近访问的 5 条历史
 * - 输入非空：历史匹配 + 默认引擎搜索 + 其他引擎搜索 + （可选）直接访问
 */
export function useSuggestions(
  query: string,
  defaultEngineName: string,
): Suggestion[] {
  const items = useHistoryStore((s) => s.items);

  return useMemo(() => {
    const q = query.trim().toLowerCase();

    // 空查询：返回最近历史
    if (!q) {
      return items
        .slice(0, MAX_RECENT_WHEN_EMPTY)
        .map((i) => ({
          kind: "history" as const,
          title: i.title,
          url: i.url,
          visitedAt: i.visitedAt,
        }));
    }

    const out: Suggestion[] = [];

    // 1. 历史匹配
    const matched = items
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.url.toLowerCase().includes(q),
      )
      .slice(0, MAX_HISTORY_SUGGESTIONS);
    out.push(
      ...matched.map((i) => ({
        kind: "history" as const,
        title: i.title,
        url: i.url,
        visitedAt: i.visitedAt,
      })),
    );

    // 2. 直接访问（输入形似 URL）
    if (isUrl(query.trim())) {
      const url = normalizeUrl(query.trim());
      out.push({
        kind: "navigate",
        url,
        display: url,
      });
    }

    // 3. 搜索引擎建议
    const defaultEngine =
      ENGINES.find((e) => e.name === defaultEngineName) ?? ENGINES[0];
    out.push({
      kind: "search",
      engineName: defaultEngine.name,
      query: query.trim(),
      url: buildSearchUrl(defaultEngine.searchUrl, query.trim()),
      color: defaultEngine.color,
      letter: defaultEngine.letter,
    });
    for (const idx of EXTRA_ENGINE_INDICES) {
      const e = ENGINES[idx];
      if (!e || e.name === defaultEngine.name) continue;
      out.push({
        kind: "search",
        engineName: e.name,
        query: query.trim(),
        url: buildSearchUrl(e.searchUrl, query.trim()),
        color: e.color,
        letter: e.letter,
      });
    }

    return out;
  }, [items, query, defaultEngineName]);
}
