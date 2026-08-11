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
