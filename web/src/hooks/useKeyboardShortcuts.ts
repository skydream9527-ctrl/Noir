import { useEffect } from "react";

type Handlers = {
  onNewTab?: () => void;
  onCloseTab?: () => void;
  onPrevTab?: () => void;
  onNextTab?: () => void;
  onFocusAddress?: () => void;
  onBlurAddress?: () => void;
};

function isEditableTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * 集中处理浏览器风格的键盘快捷键。
 * - Cmd/Ctrl+T  新建标签
 * - Cmd/Ctrl+W  关闭当前标签
 * - Cmd/Ctrl+Tab / +Shift+Tab  切换标签
 * - Cmd/Ctrl+L  聚焦地址栏
 * - Esc         失焦地址栏（仅在地址栏聚焦时）
 */
export function useKeyboardShortcuts(handlers: Handlers) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      // Cmd/Ctrl+T：新建标签
      if (mod && e.key.toLowerCase() === "t") {
        e.preventDefault();
        handlers.onNewTab?.();
        return;
      }
      // Cmd/Ctrl+W：关闭当前标签
      if (mod && e.key.toLowerCase() === "w") {
        e.preventDefault();
        handlers.onCloseTab?.();
        return;
      }
      // Cmd/Ctrl+Tab：切换标签
      if (mod && e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) handlers.onPrevTab?.();
        else handlers.onNextTab?.();
        return;
      }
      // Cmd/Ctrl+L：聚焦地址栏
      if (mod && e.key.toLowerCase() === "l") {
        e.preventDefault();
        handlers.onFocusAddress?.();
        return;
      }
      // Esc：失焦地址栏
      if (e.key === "Escape" && isEditableTarget(e.target)) {
        handlers.onBlurAddress?.();
        return;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handlers]);
}
