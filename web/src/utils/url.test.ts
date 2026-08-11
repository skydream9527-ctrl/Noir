import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isUrl,
  normalizeUrl,
  buildSearchUrl,
  resolveQueryToUrl,
  getDomain,
  prettyUrl,
  isFrameBlocked,
  getEngineDefaultSearchUrl,
} from "./url.ts";

test("isUrl", () => {
  assert.equal(isUrl("baidu.com"), true);
  assert.equal(isUrl("https://www.baidu.com"), true);
  assert.equal(isUrl("www.baidu.com/s?wd=1"), true);
  assert.equal(isUrl("hello world"), false);
  assert.equal(isUrl(""), false);
  assert.equal(isUrl("hello"), false);
});

test("normalizeUrl", () => {
  assert.equal(normalizeUrl("baidu.com"), "https://baidu.com");
  assert.equal(normalizeUrl("http://baidu.com"), "http://baidu.com");
  assert.equal(normalizeUrl("https://baidu.com"), "https://baidu.com");
});

test("buildSearchUrl", () => {
  assert.equal(
    buildSearchUrl("https://www.baidu.com/s?wd=", "你好 世界"),
    "https://www.baidu.com/s?wd=" + encodeURIComponent("你好 世界"),
  );
});

test("resolveQueryToUrl", () => {
  // URL 形式直接返回
  assert.equal(
    resolveQueryToUrl("baidu.com", "https://www.baidu.com/s?wd="),
    "https://baidu.com",
  );
  // 关键词形式拼接搜索引擎
  assert.equal(
    resolveQueryToUrl("React 教程", "https://www.baidu.com/s?wd="),
    "https://www.baidu.com/s?wd=" + encodeURIComponent("React 教程"),
  );
  // 空字符串
  assert.equal(
    resolveQueryToUrl("", "https://www.baidu.com/s?wd="),
    "",
  );
});

test("getDomain", () => {
  assert.equal(getDomain("https://www.baidu.com/s?wd=1"), "baidu.com");
  assert.equal(getDomain("https://music.example.co.jp/path"), "music.example.co.jp");
  assert.equal(getDomain("not a url"), "not a url");
});

test("prettyUrl", () => {
  assert.equal(prettyUrl("https://www.baidu.com/"), "www.baidu.com");
  assert.equal(prettyUrl("http://example.com/path/"), "example.com/path");
});

test("isFrameBlocked", () => {
  assert.equal(isFrameBlocked("https://www.baidu.com"), true);
  assert.equal(isFrameBlocked("https://bilibili.com"), true);
  assert.equal(isFrameBlocked("https://search.bilibili.com/all"), true);
  assert.equal(isFrameBlocked("https://example.com"), false);
  assert.equal(isFrameBlocked("https://my-personal-blog.netlify.app"), false);
});

test("getEngineDefaultSearchUrl", () => {
  assert.equal(
    getEngineDefaultSearchUrl("百度"),
    "https://www.baidu.com/s?wd=",
  );
  assert.equal(
    getEngineDefaultSearchUrl("必应"),
    "https://www.bing.com/search?q=",
  );
  // 未知引擎回退到百度
  assert.equal(
    getEngineDefaultSearchUrl("不存在"),
    "https://www.baidu.com/s?wd=",
  );
});
