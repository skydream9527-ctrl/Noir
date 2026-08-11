import dnsRulesText from "@/data/adblock/dns_rules.txt?raw";
import contentRulesText from "@/data/adblock/content_rules.txt?raw";

/**
 * 解析后的 DNS 规则：
 * - domain：用于 host 匹配（host == domain || host.endsWith(".domain")）
 * - pathFragments：可选的路径片段，全部需在 URL 路径中出现才命中
 */
type DnsRule = {
  domain: string;
  pathFragments: string[];
};

type CosmeticRule = {
  selector: string;
};

const dnsRules: DnsRule[] = parseDnsRules(dnsRulesText);
const cosmeticRules: CosmeticRule[] = parseCosmeticRules(contentRulesText);

function parseDnsRules(text: string): DnsRule[] {
  const out: DnsRule[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("!") || line.startsWith("[")) continue;
    if (!line.startsWith("||")) continue;
    const body = line.slice(2);
    // 按 ^ 切分：第一段是域名，后续是路径片段
    const parts = body.split("^").filter((p) => p.length > 0);
    if (parts.length === 0) continue;
    const domain = parts[0].toLowerCase();
    const pathFragments = parts.slice(1).map((p) => p.toLowerCase());
    out.push({ domain, pathFragments });
  }
  return out;
}

function parseCosmeticRules(text: string): CosmeticRule[] {
  const out: CosmeticRule[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("!") || line.startsWith("[")) continue;
    // 形如 ##.selector 或 ###id
    const idx = line.indexOf("##");
    if (idx < 0) continue;
    const selector = line.slice(idx + 2).trim();
    if (!selector) continue;
    out.push({ selector });
  }
  return out;
}

/**
 * 判断给定 URL 是否应被 DNS 层广告拦截。
 * 实现：提取 host，对每条规则判断 host 匹配 + 路径片段包含。
 */
export function shouldBlockUrl(url: string): boolean {
  let host: string;
  let path: string;
  try {
    const u = new URL(url);
    host = u.hostname.toLowerCase();
    path = (u.pathname + u.search).toLowerCase();
  } catch {
    return false;
  }
  for (const rule of dnsRules) {
    const hostHit =
      host === rule.domain || host.endsWith(`.${rule.domain}`);
    if (!hostHit) continue;
    if (rule.pathFragments.length === 0) return true;
    // 所有路径片段都需要出现
    if (rule.pathFragments.every((f) => path.includes(f))) return true;
  }
  return false;
}

/**
 * 在解析后的 DOM 文档上移除所有命中 CSS 选择器的广告元素。
 * 用于阅读模式：在交给 Readability 之前清理广告 DOM。
 */
export function stripCosmeticAds(doc: Document): number {
  let removed = 0;
  for (const { selector } of cosmeticRules) {
    try {
      const nodes = doc.querySelectorAll(selector);
      nodes.forEach((n) => {
        n.parentNode?.removeChild(n);
        removed += 1;
      });
    } catch {
      // 非法选择器，跳过
    }
  }
  return removed;
}

/**
 * 返回 CSS 隐藏样式字符串，供代理服务器注入到 HTML 响应中。
 * 形如：`.ad-container, .advertisement, ... { display: none !important; }`
 */
export function buildCosmeticCss(): string {
  const selectors = cosmeticRules.map((r) => r.selector).join(", ");
  if (!selectors) return "";
  return `${selectors} { display: none !important; visibility: hidden !important; }`;
}

/**
 * 返回可注入到 HTML <head> 的 <style> 标签字符串。
 * 代理服务器在返回 HTML 时，可在 </head> 或 <body> 起始处注入。
 */
export function buildCosmeticStyleTag(): string {
  const css = buildCosmeticCss();
  if (!css) return "";
  return `<style data-noir-adblock>${css}</style>`;
}

export function getRulesCount(): { dns: number; cosmetic: number } {
  return { dns: dnsRules.length, cosmetic: cosmeticRules.length };
}
