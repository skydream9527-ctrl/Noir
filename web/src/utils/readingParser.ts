export type ParsedArticle = {
  title: string;
  content: string;
  byline?: string;
  excerpt?: string;
  wordCount: number;
};

/**
 * 从一段 HTML 字符串中提取阅读模式正文。
 * 简化版的 Readability 算法：评分候选节点，取分数最高者作为正文。
 */
export function parseArticleFromHtml(html: string): ParsedArticle {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // 标题
  const title =
    doc.querySelector("article h1")?.textContent?.trim() ||
    doc.querySelector("h1")?.textContent?.trim() ||
    doc.querySelector("title")?.textContent?.trim() ||
    "未命名文档";

  // 移除干扰节点
  const removeSelectors = [
    "script", "style", "noscript", "iframe", "form",
    "header", "footer", "nav", "aside",
    ".nav", ".menu", ".sidebar", ".comment", ".comments",
    ".ad", ".ads", ".advertisement", ".share", ".related",
    "[role=navigation]", "[role=banner]", "[role=complementary]",
  ];
  removeSelectors.forEach((sel) => {
    doc.querySelectorAll(sel).forEach((el) => el.remove());
  });

  // 候选节点评分
  const candidates = new Map<Element, number>();
  const blockTags = ["ARTICLE", "DIV", "SECTION", "MAIN"];

  doc.querySelectorAll("p, pre, blockquote, li, h1, h2, h3").forEach((p) => {
    const text = p.textContent ?? "";
    const len = text.trim().length;
    if (len < 25) return;

    let parent: Element | null = p.parentElement;
    let depth = 0;
    while (parent && depth < 3) {
      if (blockTags.includes(parent.tagName)) {
        const current = candidates.get(parent) ?? 0;
        // 段落文本越长，得分越高；按深度衰减
        const score = Math.log2(len + 1) * (1 - depth * 0.15);
        candidates.set(parent, current + score);
      }
      parent = parent.parentElement;
      depth++;
    }
  });

  // 选最高分
  let best: Element | null = null;
  let bestScore = 0;
  candidates.forEach((score, el) => {
    if (score > bestScore) {
      bestScore = score;
      best = el;
    }
  });

  // 兜底：取 body
  if (!best || bestScore < 5) {
    best = doc.querySelector("article") || doc.body;
  }

  // 清理：移除内部空 div、链接密集块
  if (best) {
    best.querySelectorAll("div:empty, span:empty").forEach((el) => el.remove());
  }

  const content = best?.innerHTML?.trim() || doc.body.innerHTML.trim();
  const plainText = best?.textContent?.trim() || "";
  const wordCount = plainText.replace(/\s+/g, " ").length;

  // 摘要
  const excerpt =
    plainText.slice(0, 120).replace(/\s+/g, " ").trim() +
    (plainText.length > 120 ? "…" : "");

  return { title, content, excerpt, wordCount };
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
  const content = body
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");

  const plainText = body.join(" ");
  return {
    title,
    content: content || `<p>${escapeHtml(paragraphs[0] || "")}</p>`,
    wordCount: plainText.length,
    excerpt: plainText.slice(0, 120) + (plainText.length > 120 ? "…" : ""),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * 通过 CORS 代理抓取 URL 内容（演示用途）。
 * 注意：依赖第三方代理，可能不稳定。
 */
export async function fetchArticle(url: string): Promise<ParsedArticle> {
  const target = url.trim();
  if (!target) throw new Error("请输入 URL 或文本");

  // 如果不是 URL，按纯文本解析
  if (!/^https?:\/\//i.test(target) && !/\.[\w-]+/.test(target)) {
    return parseArticleFromText(target);
  }

  const finalUrl = /^https?:\/\//i.test(target) ? target : `https://${target}`;
  const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(finalUrl)}`;

  const res = await fetch(proxy);
  if (!res.ok) throw new Error(`抓取失败：HTTP ${res.status}`);
  const html = await res.text();
  if (!html || html.length < 200) throw new Error("抓取到的内容为空");

  return parseArticleFromHtml(html);
}
