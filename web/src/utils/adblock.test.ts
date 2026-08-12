import { describe, expect, it } from "vitest";
import {
  buildCosmeticCss,
  buildCosmeticStyleTag,
  getRulesCount,
  shouldBlockUrl,
  stripCosmeticAds,
} from "@/utils/adblock";

describe("shouldBlockUrl", () => {
  it("命中域名黑名单", () => {
    expect(shouldBlockUrl("https://doubleclick.net/track")).toBe(true);
    expect(shouldBlockUrl("https://ads.doubleclick.net/x")).toBe(true);
    expect(shouldBlockUrl("https://googlesyndication.com/ad")).toBe(true);
  });

  it("非黑名单域名放行", () => {
    expect(shouldBlockUrl("https://example.com/page")).toBe(false);
    expect(shouldBlockUrl("https://baidu.com/search")).toBe(false);
  });

  it("非法 URL 放行", () => {
    expect(shouldBlockUrl("not-a-url")).toBe(false);
    expect(shouldBlockUrl("")).toBe(false);
  });

  it("带路径片段的规则需路径匹配", () => {
    // dns_rules.txt 中有 baidu.com^ad^ 类规则
    expect(shouldBlockUrl("https://baidu.com/ad/x")).toBe(true);
    expect(shouldBlockUrl("https://baidu.com/normal")).toBe(false);
  });
});

describe("stripCosmeticAds", () => {
  it("移除命中选择器的元素", () => {
    const doc = new DOMParser().parseFromString(
      `<html><body>
        <div class="ad-container">广告1</div>
        <p>正文</p>
        <div class="advertisement">广告2</div>
      </body></html>`,
      "text/html",
    );
    const removed = stripCosmeticAds(doc);
    expect(removed).toBeGreaterThan(0);
    expect(doc.body.textContent).toContain("正文");
    expect(doc.body.textContent).not.toContain("广告1");
    expect(doc.body.textContent).not.toContain("广告2");
  });

  it("无广告元素时返回 0", () => {
    const doc = new DOMParser().parseFromString(
      `<html><body><p>干净内容</p></body></html>`,
      "text/html",
    );
    expect(stripCosmeticAds(doc)).toBe(0);
  });
});

describe("buildCosmeticCss / buildCosmeticStyleTag", () => {
  it("生成 display:none 样式", () => {
    const css = buildCosmeticCss();
    expect(css).toContain("display: none !important");
    expect(css).toContain(".ad-container");
  });

  it("style 标签包含 <style>", () => {
    const tag = buildCosmeticStyleTag();
    expect(tag).toContain("<style");
    expect(tag).toContain("</style>");
  });
});

describe("getRulesCount", () => {
  it("返回非零的 DNS 与 CSS 规则数", () => {
    const count = getRulesCount();
    expect(count.dns).toBeGreaterThan(0);
    expect(count.cosmetic).toBeGreaterThan(0);
  });
});
