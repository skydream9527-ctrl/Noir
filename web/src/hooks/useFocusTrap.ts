import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * 在容器内实现焦点陷阱（focus trap）：
 * - 激活时聚焦容器内第一个可聚焦元素
 * - Tab/Shift+Tab 在容器内循环
 * - 卸载时把焦点恢复到激活前的元素
 *
 * @param containerRef 容器引用
 * @param active 是否激活陷阱
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // 记录激活前的焦点，便于卸载时恢复
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // 聚焦容器内第一个可聚焦元素
    const focusables = getFocusables(container);
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      container.tabIndex = -1;
      container.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const root = containerRef.current;
      if (!root) return;
      const list = getFocusables(root);
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        // Shift+Tab：从第一个跳到最后一个
        if (document.activeElement === first || !root.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab：从最后一个跳到第一个
        if (document.activeElement === last || !root.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // 恢复焦点
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [containerRef, active]);
}

function getFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        el.offsetParent !== null
      );
    },
  );
}
