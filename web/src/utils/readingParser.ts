import { Readability } from "@mozilla/readability";
import { withProxy } from "@/utils/proxy";
import { stripCosmeticAds } from "@/utils/adblock";

export type ParsedArticle = {
  title: string;
  content: string;
  byline?: string;
  excerpt?: string;
  wordCount: number;
  readingMinutes: number;
  toc: TocItem[];
};

export type TocItem = {
  id: string;
  level: 2 | 3;
  text: string;
};

/**
 * 从一段 HTML 字符串中提取阅读模式正文。
 * 使用 Mozilla Readability 算法（与 Firefox 阅读视图同源），并生成 TOC。
 */
export function parseArticleFromHtml(html: string): ParsedArticle {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // 在交给 Readability 之前，先用 CSS 选择器移除广告元素
  stripCosmeticAds(doc);

  // Readability 会修改传入的 doc，先克隆
  const clone = doc.cloneNode(true) as Document;
  let article;
  try {
    article = new Readability(clone).parse();
  } catch {
    article = null;
  }

  const title =
    article?.title?.trim() ||
    doc.querySelector("title")?.textContent?.trim() ||
    "未命名文档";
  const content = article?.content?.trim() || doc.body.innerHTML.trim();
  const plainText =
    article?.textContent?.trim() || doc.body.textContent?.trim() || "";
  const wordCount = plainText.replace(/\s+/g, " ").length;
  const excerpt = article?.excerpt?.trim() || plainText.slice(0, 120) + (plainText.length > 120 ? "…" : "");
  const readingMinutes = estimateReadingMinutes(plainText);

  // 在解析后的 content 上生成 TOC
  const toc = buildToc(content);

  return {
    title,
    content,
    byline: article?.byline,
    excerpt,
    wordCount,
    readingMinutes,
    toc,
  };
}

/**
 * 从纯文本生成阅读视图（按段落切分）。
 */
export function parseArticleFromText(text: string): ParsedArticle {
  const paragraphs = text
    .split(/\n{1,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const title = paragraphs[0]?.slice(0, 60) || "未命名";
  const body = paragraphs.slice(paragraphs[0].length > 60 ? 0 : 1);
  const content = body.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
  const plainText = body.join(" ");

  return {
    title,
    content: content || `<p>${escapeHtml(paragraphs[0] || "")}</p>`,
    wordCount: plainText.length,
    readingMinutes: estimateReadingMinutes(plainText),
    excerpt: plainText.slice(0, 120) + (plainText.length > 120 ? "…" : ""),
    toc: [],
  };
}

/**
 * 中文按 400 字/分钟，英文按 250 词/分钟，混合时取估算下限。
 */
export function estimateReadingMinutes(text: string): number {
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const minutes = chinese / 400 + englishWords / 250;
  return Math.max(1, Math.round(minutes));
}

/**
 * 从 HTML 内容中提取 h2/h3，为每个标题生成稳定 id。
 */
export function buildToc(html: string): TocItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const headings = Array.from(doc.querySelectorAll("h2, h3"));
  const toc: TocItem[] = [];
  const usedText = new Map<string, number>();

  headings.forEach((h) => {
    const text = (h.textContent || "").trim();
    if (!text || text.length > 80) return;
    const level = (h.tagName === "H2" ? 2 : 3) as 2 | 3;
    const id = slugify(text) || `h-${toc.length}`;
    // 去重 id
    const count = usedText.get(id) ?? 0;
    usedText.set(id, count + 1);
    const finalId = count === 0 ? id : `${id}-${count}`;
    h.id = finalId;
    toc.push({ id: finalId, level, text });
  });

  return toc;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 通过代理抓取 URL 内容。
 */
export async function fetchArticle(url: string): Promise<ParsedArticle> {
  const target = url.trim();
  if (!target) throw new Error("请输入 URL 或文本");

  if (!/^https?:\/\//i.test(target) && !/\.[\w-]+/.test(target)) {
    return parseArticleFromText(target);
  }

  const finalUrl = /^https?:\/\//i.test(target) ? target : `https://${target}`;
  const proxied = withProxy(finalUrl);
  const fallback = `https://api.allorigins.win/raw?url=${encodeURIComponent(finalUrl)}`;

  let res: Response;
  try {
    res = await fetch(proxied);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    res = await fetch(fallback);
    if (!res.ok) throw new Error(`抓取失败：HTTP ${res.status}`);
  }
  const html = await res.text();
  if (!html || html.length < 200) throw new Error("抓取到的内容为空");

  return parseArticleFromHtml(html);
}

/**
 * 重建正文 HTML，注入 TOC 锚点 id。
 * 当 buildToc 修改的是临时 doc 时，需要把 id 同步回实际渲染的 HTML。
 */
export function injectTocIds(html: string, toc: TocItem[]): string {
  if (toc.length === 0) return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const headings = Array.from(doc.querySelectorAll("h2, h3"));
  let i = 0;
  headings.forEach((h) => {
    const text = (h.textContent || "").trim();
    if (!text || i >= toc.length) return;
    // 顺序匹配：buildToc 也是顺序遍历的
    h.id = toc[i].id;
    i++;
  });
  return doc.querySelector("div")?.innerHTML || html;
}
