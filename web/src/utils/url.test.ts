import { describe, expect, it } from "vitest";
import {
  buildSearchUrl,
  getDomain,
  getEngineDefaultSearchUrl,
  getFaviconUrl,
  isFrameBlocked,
  isUrl,
  normalizeUrl,
  prettyUrl,
  resolveQueryToUrl,
} from "@/utils/url";

describe("isUrl", () => {
  it("识别带协议的 URL", () => {
    expect(isUrl("https://example.com")).toBe(true);
    expect(isUrl("http://example.com/path")).toBe(true);
  });

  it("识别裸域名", () => {
    expect(isUrl("example.com")).toBe(true);
    expect(isUrl("sub.example.com/path")).toBe(true);
  });

  it("含空格的查询不是 URL", () => {
    expect(isUrl("hello world")).toBe(false);
  });

  it("纯关键词不是 URL", () => {
    expect(isUrl("搜索词")).toBe(false);
    expect(isUrl("")).toBe(false);
  });
});

describe("normalizeUrl", () => {
  it("已有协议原样返回", () => {
    expect(normalizeUrl("http://x.com")).toBe("http://x.com");
  });

  it("无协议补 https", () => {
    expect(normalizeUrl("example.com")).toBe("https://example.com");
  });
});

describe("buildSearchUrl", () => {
  it("拼接引擎前缀与编码后的查询", () => {
    expect(buildSearchUrl("https://baidu.com/s?wd=", "测试")).toBe(
      "https://baidu.com/s?wd=" + encodeURIComponent("测试"),
    );
  });
});

describe("resolveQueryToUrl", () => {
  it("空查询返回空串", () => {
    expect(resolveQueryToUrl("", "https://baidu.com/s?wd=")).toBe("");
  });

  it("URL 查询返回规范化 URL", () => {
    expect(resolveQueryToUrl("example.com", "https://baidu.com/s?wd=")).toBe(
      "https://example.com",
    );
  });

  it("关键词查询返回搜索 URL", () => {
    expect(resolveQueryToUrl("测试", "https://baidu.com/s?wd=")).toBe(
      "https://baidu.com/s?wd=" + encodeURIComponent("测试"),
    );
  });
});

describe("getDomain", () => {
  it("提取 hostname 并去掉 www", () => {
    expect(getDomain("https://www.example.com/path")).toBe("example.com");
    expect(getDomain("https://sub.example.com")).toBe("sub.example.com");
  });

  it("非法 URL 原样返回", () => {
    expect(getDomain("not-a-url")).toBe("not-a-url");
  });
});

describe("getFaviconUrl", () => {
  it("生成 google s2 favicon URL", () => {
    expect(getFaviconUrl("https://www.example.com")).toContain(
      "google.com/s2/favicons",
    );
    expect(getFaviconUrl("https://www.example.com")).toContain(
      "domain=www.example.com",
    );
  });

  it("非法 URL 返回空串", () => {
    expect(getFaviconUrl("invalid")).toBe("");
  });
});

describe("prettyUrl", () => {
  it("移除协议与结尾斜杠", () => {
    expect(prettyUrl("https://example.com/")).toBe("example.com");
    expect(prettyUrl("http://example.com/path/")).toBe("example.com/path");
  });
});

describe("getEngineDefaultSearchUrl", () => {
  it("存在的引擎返回其 searchUrl", () => {
    // 百度是默认引擎
    const url = getEngineDefaultSearchUrl("百度");
    expect(url).toContain("baidu.com");
  });

  it("不存在的引擎返回百度兜底", () => {
    expect(getEngineDefaultSearchUrl("不存在的引擎")).toBe(
      "https://www.baidu.com/s?wd=",
    );
  });
});

describe("isFrameBlocked", () => {
  it("已知禁止嵌入的域名返回 true", () => {
    expect(isFrameBlocked("https://www.baidu.com")).toBe(true);
    expect(isFrameBlocked("https://bilibili.com")).toBe(true);
    expect(isFrameBlocked("https://github.com")).toBe(true);
  });

  it("子域名同样被拦截", () => {
    expect(isFrameBlocked("https://search.bilibili.com")).toBe(true);
  });

  it("允许嵌入的域名返回 false", () => {
    expect(isFrameBlocked("https://example.com")).toBe(false);
  });

  it("非法 URL 返回 false", () => {
    expect(isFrameBlocked("not-a-url")).toBe(false);
  });
});
