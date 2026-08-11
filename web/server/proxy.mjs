#!/usr/bin/env node
/**
 * Noir Web — 本地开发代理
 *
 * 与 worker/proxy.ts 等价的 Node 实现，便于在开发环境直接运行：
 *   node server/proxy.mjs
 * 监听 http://localhost:8787
 *
 * 行为：接收 ?url=<目标>，转发请求并移除 X-Frame-Options / CSP，
 * 注入 CORS 头，让前端 iframe / fetch 能跨域访问。
 * 对 HTML 响应注入广告隐藏样式表。
 */

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const PORT = process.env.PROXY_PORT ? Number(process.env.PROXY_PORT) : 8787;
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = resolvePath(__dirname, "../src/data/adblock");

// 启动时加载一次规则，生成 CSS 字符串
let cosmeticCss = "";
try {
  const text = await readFile(resolvePath(RULES_DIR, "content_rules.txt"), "utf8");
  const selectors = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("!") && !l.startsWith("["))
    .map((l) => {
      const idx = l.indexOf("##");
      return idx >= 0 ? l.slice(idx + 2).trim() : "";
    })
    .filter(Boolean);
  if (selectors.length > 0) {
    cosmeticCss = `${selectors.join(", ")} { display: none !important; visibility: hidden !important; }`;
  }
  console.log(`[noir-proxy] loaded ${selectors.length} cosmetic ad rules`);
} catch (e) {
  console.warn("[noir-proxy] failed to load cosmetic rules:", e.message);
}

const AD_STYLE_TAG = cosmeticCss
  ? `<style data-noir-adblock>${cosmeticCss}</style>`
  : "";

function sendJson(res, obj, status = 400) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

/**
 * @param {import("node:http").IncomingMessage} req
 * @param {import("node:http").ServerResponse} res
 */
function handle(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    });
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || "/", `http://localhost:${PORT}`);
  const target = reqUrl.searchParams.get("url");
  if (!target) {
    sendJson(res, { error: "missing url param" }, 400);
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(decodeURIComponent(target));
    if (!/^https?:$/.test(targetUrl.protocol)) {
      sendJson(res, { error: "only http/https allowed" }, 400);
      return;
    }
  } catch {
    sendJson(res, { error: "invalid url" }, 400);
    return;
  }

  const lib = targetUrl.protocol === "https:" ? https : http;
  const upstreamReq = lib.request(
    targetUrl,
    {
      method: "GET",
      timeout: 10000,
      headers: {
        "User-Agent": req.headers["user-agent"] || "NoirProxy/1.0",
        Accept: req.headers["accept"] || "*/*",
        "Accept-Language":
          req.headers["accept-language"] || "zh-CN,zh;q=0.9,en;q=0.8",
      },
    },
    (upstream) => {
      const headers = { ...upstream.headers };
      // 移除嵌入限制
      delete headers["x-frame-options"];
      delete headers["content-security-policy"];
      delete headers["content-security-policy-report-only"];
      delete headers["frame-options"];
      // 移除 hop-by-hop 头
      for (const h of HOP_BY_HOP) delete headers[h];

      headers["access-control-allow-origin"] = "*";
      headers["access-control-allow-methods"] = "GET, OPTIONS";
      headers["access-control-allow-headers"] = "*";
      headers["x-noir-proxied"] = "1";

      const contentType = String(headers["content-type"] || "").toLowerCase();
      const isHtml = contentType.includes("text/html") && AD_STYLE_TAG;

      try {
        if (isHtml) {
          // 缓冲 HTML，注入广告隐藏样式后返回
          const chunks = [];
          upstream.on("data", (c) => chunks.push(c));
          upstream.on("end", () => {
            const body = Buffer.concat(chunks).toString("utf8");
            let injected = body;
            if (/<head[^>]*>/i.test(body)) {
              injected = body.replace(/<head[^>]*>/i, (m) => `${m}${AD_STYLE_TAG}`);
            } else if (/<html[^>]*>/i.test(body)) {
              injected = body.replace(/<html[^>]*>/i, (m) => `${m}${AD_STYLE_TAG}`);
            } else {
              injected = AD_STYLE_TAG + body;
            }
            // 移除 Content-Length（长度已变），改用 chunked 或直接 end
            delete headers["content-length"];
            headers["content-type"] = "text/html; charset=utf-8";
            res.writeHead(upstream.statusCode || 200, headers);
            res.end(injected);
          });
          upstream.on("error", () => {
            try {
              sendJson(res, { error: "upstream stream error" }, 502);
            } catch {}
          });
        } else {
          res.writeHead(upstream.statusCode || 200, headers);
          upstream.pipe(res);
        }
      } catch (e) {
        console.error("[noir-proxy] writeHead failed:", e.message);
      }
    },
  );

  upstreamReq.on("timeout", () => {
    console.error("[noir-proxy] upstream timeout for", targetUrl.href);
    upstreamReq.destroy(new Error("upstream timeout"));
  });

  upstreamReq.on("error", (err) => {
    console.error("[noir-proxy] upstream error:", err.code || err.message);
    try {
      sendJson(res, {
        error: err.message || err.code || "upstream fetch failed",
        code: err.code,
      }, 502);
    } catch (e) {
      console.error("[noir-proxy] sendJson failed:", e.message);
    }
  });

  upstreamReq.end();
}

const server = http.createServer(handle);
server.on("clientError", (err, socket) => {
  console.error("[noir-proxy] clientError:", err.message);
  try {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  } catch {}
});

process.on("uncaughtException", (err) => {
  console.error("[noir-proxy] uncaughtException:", err.stack || err.message);
});
process.on("unhandledRejection", (err) => {
  console.error("[noir-proxy] unhandledRejection:", err);
});

server.listen(PORT, () => {
  console.log(`[noir-proxy] listening on http://localhost:${PORT}`);
  console.log(`[noir-proxy] usage: http://localhost:${PORT}/?url=<encoded target>`);
});
