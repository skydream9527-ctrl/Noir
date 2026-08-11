/**
 * Noir Web — 嵌入代理
 *
 * 生产部署：Cloudflare Worker
 * 接收 ?url=<目标>，fetch 目标站点后：
 *   - 移除 X-Frame-Options
 *   - 移除 Content-Security-Policy 中的 frame-ancestors 限制
 *   - 注入 CORS 允许头
 *   - 对 HTML 响应注入广告隐藏样式表
 *
 * 仅用于学习演示，请勿用于绕过真实站点的安全策略做生产服务。
 */

const ALLOWED_ORIGINS = ["http://localhost:5173", "https://noir.local"];

// 复用原 Android 项目的 CSS 元素隐藏规则（content_rules.txt）
const COSMETIC_SELECTORS = [
  ".ad-container",
  ".advertisement",
  ".ad-wrapper",
  ".ad-banner",
  "#banner-ad",
  '[class*="ad-"]',
  '[id*="ad-"]',
  ".sidebar-ad",
  ".footer-ad",
  ".header-ad",
  '[class*="advertisement"]',
  '[id*="advertisement"]',
  '[class*="google-ad"]',
  '[id*="google-ad"]',
];
const AD_STYLE_TAG = `<style data-noir-adblock>${COSMETIC_SELECTORS.join(", ")} { display: none !important; visibility: hidden !important; }</style>`;

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const target = url.searchParams.get("url");
    if (!target) {
      return json({ error: "missing url param" }, 400);
    }

    let targetUrl: string;
    try {
      targetUrl = decodeURIComponent(target);
      // 仅允许 http/https
      const parsed = new URL(targetUrl);
      if (!/^https?:$/.test(parsed.protocol)) {
        return json({ error: "only http/https allowed" }, 400);
      }
    } catch {
      return json({ error: "invalid url" }, 400);
    }

    // 简单速率限制提示（生产应接入 Cloudflare KV/Durable Object）
    try {
      const upstream = await fetch(targetUrl, {
        headers: {
          "User-Agent": req.headers.get("User-Agent") ?? "NoirProxy/1.0",
          Accept: req.headers.get("Accept") ?? "*/*",
          "Accept-Language": req.headers.get("Accept-Language") ?? "zh-CN,zh;q=0.9,en;q=0.8",
        },
        redirect: "follow",
      });

      const headers = new Headers(upstream.headers);

      // 移除嵌入限制
      headers.delete("X-Frame-Options");
      headers.delete("Content-Security-Policy");
      headers.delete("Content-Security-Policy-Report-Only");
      headers.delete("Frame-Options");

      // 注入 CORS
      const origin = req.headers.get("Origin") ?? "";
      if (ALLOWED_ORIGINS.includes(origin)) {
        headers.set("Access-Control-Allow-Origin", origin);
      } else {
        headers.set("Access-Control-Allow-Origin", "*");
      }
      headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "*");
      // 标记经过代理
      headers.set("X-Noir-Proxied", "1");

      const contentType = (headers.get("Content-Type") || "").toLowerCase();
      if (contentType.includes("text/html")) {
        // 缓冲 HTML，注入广告隐藏样式
        const text = await upstream.text();
        let injected = text;
        if (/<head[^>]*>/i.test(text)) {
          injected = text.replace(/<head[^>]*>/i, (m) => `${m}${AD_STYLE_TAG}`);
        } else if (/<html[^>]*>/i.test(text)) {
          injected = text.replace(/<html[^>]*>/i, (m) => `${m}${AD_STYLE_TAG}`);
        } else {
          injected = AD_STYLE_TAG + text;
        }
        headers.delete("Content-Length");
        headers.set("Content-Type", "text/html; charset=utf-8");
        return new Response(injected, {
          status: upstream.status,
          statusText: upstream.statusText,
          headers,
        });
      }

      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers,
      });
    } catch (e) {
      return json(
        { error: e instanceof Error ? e.message : "upstream fetch failed" },
        502,
      );
    }
  },
};

function json(obj: unknown, status: number): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
