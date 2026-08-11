import { useEffect, useState } from "react";

/**
 * 监听容器滚动，返回阅读进度百分比 0-100。
 */
export function useReadingProgress(targetRef: React.RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    function onScroll() {
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight) {
        setProgress(100);
        return;
      }
      const max = scrollHeight - clientHeight;
      const p = Math.min(100, Math.max(0, (scrollTop / max) * 100));
      setProgress(p);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [targetRef]);

  return progress;
}

/**
 * 监听容器内多个标题元素，返回当前激活的 id。
 */
export function useActiveHeading(
  containerRef: React.RefObject<HTMLElement>,
  ids: string[],
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  // ids 拼接为字符串作为依赖，避免数组引用变更导致的重复订阅
  const idsKey = ids.join("|");
  useEffect(() => {
    const el = containerRef.current;
    const idList = idsKey ? idsKey.split("|") : [];
    if (!el || idList.length === 0) return;

    function onScroll() {
      if (!el) return;
      const { scrollTop } = el;
      // 找到最后一个顶部已滚出容器上方 100px 的标题
      let current: string | null = null;
      for (const id of idList) {
        const node = el.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null;
        if (!node) continue;
        // 标题相对容器的偏移
        const offset = node.offsetTop - el.offsetTop;
        if (offset - 100 <= scrollTop) {
          current = id;
        } else {
          break;
        }
      }
      setActiveId(current);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef, idsKey]);

  return activeId;
}
