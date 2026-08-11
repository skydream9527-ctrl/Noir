import { ENGINES } from "@/data/engines";

export function isUrl(query: string): boolean {
  const q = query.trim();
  if (!q || q.includes(" ")) return false;
  // 形如 xxx.xxx 或带协议
  if (/^https?:\/\//i.test(q)) return true;
  return /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(q);
}

export function normalizeUrl(query: string): string {
  const q = query.trim();
  if (/^https?:\/\//i.test(q)) return q;
  return `https://${q}`;
}

export function buildSearchUrl(engineSearchUrl: string, query: string): string {
  return engineSearchUrl + encodeURIComponent(query.trim());
}

export function resolveQueryToUrl(
  query: string,
  engineSearchUrl: string,
): string {
  const q = query.trim();
  if (!q) return "";
  if (isUrl(q)) return normalizeUrl(q);
  return buildSearchUrl(engineSearchUrl, q);
}

export function getDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getFaviconUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return "";
  }
}

export function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * 根据引擎名返回其搜索 URL 前缀（用于地址栏提交搜索词时）。
 */
export function getEngineDefaultSearchUrl(engineName: string): string {
  return (
    ENGINES.find((e) => e.name === engineName)?.searchUrl ??
    "https://www.baidu.com/s?wd="
  );
}

/**
 * 已知禁止 iframe 嵌入的域名（X-Frame-Options: DENY/SAMEORIGIN 或 CSP frame-ancestors）。
 * 这些站点加载到 iframe 中会显示空白，需要预先提示用户。
 */
const FRAME_BLOCKED_DOMAINS = [
  "baidu.com",
  "www.baidu.com",
  "sogou.com",
  "www.sogou.com",
  "bing.com",
  "www.bing.com",
  "zhihu.com",
  "www.zhihu.com",
  "bilibili.com",
  "www.bilibili.com",
  "search.bilibili.com",
  "douyin.com",
  "www.douyin.com",
  "youku.com",
  "www.youku.com",
  "iqiyi.com",
  "www.iqiyi.com",
  "so.iqiyi.com",
  "v.qq.com",
  "doubao.com",
  "www.doubao.com",
  "tongyi.aliyun.com",
  "google.com",
  "www.google.com",
  "youtube.com",
  "www.youtube.com",
  "github.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "facebook.com",
];

export function isFrameBlocked(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return FRAME_BLOCKED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}
