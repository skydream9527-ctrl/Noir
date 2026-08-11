import { useSettingsStore } from "@/store/useSettingsStore";

/**
 * 根据当前设置构造代理 URL。
 * 若代理未启用，返回原始 URL。
 */
export function withProxy(targetUrl: string): string {
  const { proxyEnabled, proxyBaseUrl } = useSettingsStore.getState();
  if (!proxyEnabled || !proxyBaseUrl) return targetUrl;
  const base = proxyBaseUrl.replace(/\/$/, "");
  return `${base}/?url=${encodeURIComponent(targetUrl)}`;
}

/**
 * 仅在显式需要时构造代理 URL（即使代理未启用，也可手动调用）。
 */
export function buildProxyUrl(
  targetUrl: string,
  proxyBaseUrl: string,
): string {
  const base = proxyBaseUrl.replace(/\/$/, "");
  return `${base}/?url=${encodeURIComponent(targetUrl)}`;
}
