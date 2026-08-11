import { useEffect, useRef, useState } from "react";
import { isFrameBlocked } from "@/utils/url";

export type FrameState = "idle" | "loading" | "loaded" | "blocked";

const BLOCKED_DETECT_TIMEOUT = 6000;

/**
 * 管理 iframe 加载状态：
 * - 预判黑名单：直接标记为 blocked
 * - 否则进入 loading，onLoad 时尝试探测 contentDocument
 * - 超时（6s）未触发 onLoad，也标记为 blocked
 */
export function useIframeBlock(url: string) {
  const [state, setState] = useState<FrameState>("idle");
  const timerRef = useRef<number | null>(null);
  const preBlocked = isFrameBlocked(url);

  useEffect(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!url || url === "about:blank") {
      setState("idle");
      return;
    }

    if (preBlocked) {
      setState("blocked");
      return;
    }

    setState("loading");

    timerRef.current = window.setTimeout(() => {
      setState((cur) => (cur === "loading" ? "blocked" : cur));
    }, BLOCKED_DETECT_TIMEOUT);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [url, preBlocked]);

  function handleLoad() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // 跨域时无法读取 contentDocument；若可读且为空白文档，视为失败
    try {
      const doc = (document.getElementById(
        "noir-frame",
      ) as HTMLIFrameElement | null)?.contentDocument;
      if (doc && doc.body && doc.body.children.length === 0) {
        setState("blocked");
        return;
      }
    } catch {
      // 跨域访问抛错是正常的，不视为失败
    }
    setState("loaded");
  }

  return { state, preBlocked, handleLoad };
}
