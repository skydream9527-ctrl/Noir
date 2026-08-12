import { describe, expect, it } from "vitest";
import {
  buildToc,
  estimateReadingMinutes,
  injectTocIds,
  parseArticleFromHtml,
  parseArticleFromText,
} from "@/utils/readingParser";

describe("estimateReadingMinutes", () => {
  it("空文本至少返回 1 分钟", () => {
    expect(estimateReadingMinutes("")).toBe(1);
  });

  it("中文按 400 字/分钟计算", () => {
    // 800 字 → 2 分钟
    const text = "字".repeat(800);
    expect(estimateReadingMinutes(text)).toBe(2);
  });

  it("英文按 250 词/分钟计算", () => {
    // 500 词 → 2 分钟
    const text = Array.from({ length: 500 }, () => "word").join(" ");
    expect(estimateReadingMinutes(text)).toBe(2);
  });

  it("不足 1 分钟向上取整为 1", () => {
    expect(estimateReadingMinutes("短文本")).toBe(1);
  });
});

describe("parseArticleFromText", () => {
  it("按段落切分，首行作为标题", () => {
    const text = "这是标题\n第一段内容\n第二段内容";
    const article = parseArticleFromText(text);
    expect(article.title).toBe("这是标题");
    expect(article.content).toContain("第一段内容");
    expect(article.content).toContain("第二段内容");
    expect(article.content).toContain("<p>");
    expect(article.toc).toEqual([]);
    expect(article.wordCount).toBeGreaterThan(0);
  });

  it("首行过长时仍作为标题保留", () => {
    const longTitle = "这是一个非常非常长的标题".repeat(10);
    const text = `${longTitle}\n正文`;
    const article = parseArticleFromText(text);
    expect(article.title).toBe(longTitle.slice(0, 60));
  });

  it("转义 HTML 特殊字符", () => {
    const text = "标题\n<script>alert(1)</script>";
    const article = parseArticleFromText(text);
    expect(article.content).toContain("&lt;script&gt;");
    expect(article.content).not.toContain("<script>");
  });
});

describe("buildToc", () => {
  it("提取 h2/h3 并生成稳定 id", () => {
    const html = "<h2>第一章</h2><p>内容</p><h3>子节</h3><h2>第二章</h2>";
    const toc = buildToc(html);
    expect(toc).toHaveLength(3);
    expect(toc[0]).toEqual({ id: "第一章", level: 2, text: "第一章" });
    expect(toc[1].level).toBe(3);
    expect(toc[1].text).toBe("子节");
    expect(toc[2].level).toBe(2);
  });

  it("相同文本生成去重 id", () => {
    const html = "<h2>重复</h2><h2>重复</h2>";
    const toc = buildToc(html);
    expect(toc).toHaveLength(2);
    expect(toc[0].id).toBe("重复");
    expect(toc[1].id).toBe("重复-1");
  });

  it("超过 80 字符的标题被忽略", () => {
    const longHeading = "字".repeat(81);
    const html = `<h2>${longHeading}</h2><h2>正常</h2>`;
    const toc = buildToc(html);
    expect(toc).toHaveLength(1);
    expect(toc[0].text).toBe("正常");
  });

  it("无标题时返回空数组", () => {
    expect(buildToc("<p>仅段落</p>")).toEqual([]);
  });
});

describe("injectTocIds", () => {
  it("按顺序为标题注入 id", () => {
    const html = "<h2>标题一</h2><p>内容</p><h2>标题二</h2>";
    const toc = buildToc(html);
    const injected = injectTocIds(html, toc);
    expect(injected).toContain(`id="${toc[0].id}"`);
    expect(injected).toContain(`id="${toc[1].id}"`);
  });

  it("toc 为空时原样返回", () => {
    const html = "<p>仅段落</p>";
    expect(injectTocIds(html, [])).toBe(html);
  });
});

describe("parseArticleFromHtml", () => {
  it("从完整 HTML 提取正文与标题", () => {
    const html = `
      <!doctype html><html><head><title>测试文章标题</title></head>
      <body>
        <header><nav>导航</nav></header>
        <article>
          <h1>测试文章标题</h1>
          <p>${"这是一段足够长的正文内容用于让 Readability 识别为文章主体。".repeat(10)}</p>
          <h2>第二章</h2>
          <p>${"更多正文内容继续在这里展开以增加长度。".repeat(10)}</p>
        </article>
        <aside class="ad-container">广告内容</aside>
      </body></html>
    `;
    const article = parseArticleFromHtml(html);
    expect(article.title).toBeTruthy();
    expect(article.content).toContain("<");
    expect(article.wordCount).toBeGreaterThan(0);
    expect(article.readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it("广告元素在解析前被移除", () => {
    const html = `
      <html><head><title>带广告的文章</title></head>
      <body>
        <article>
          <h1>带广告的文章</h1>
          <p>${"正文内容需要足够长度以便 Readability 识别。".repeat(15)}</p>
        </article>
        <div class="ad-container">购买我们的产品</div>
        <div class="advertisement">立即点击</div>
      </body></html>
    `;
    const article = parseArticleFromHtml(html);
    expect(article.content).not.toContain("购买我们的产品");
    expect(article.content).not.toContain("立即点击");
  });

  it("无 title 标签时使用兜底标题", () => {
    const html = `<html><body><p>${"内容".repeat(200)}</p></body></html>`;
    const article = parseArticleFromHtml(html);
    // Readability 可能解析出标题也可能用兜底
    expect(typeof article.title).toBe("string");
    expect(article.title.length).toBeGreaterThan(0);
  });
});
