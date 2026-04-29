/**
 * Local preview server — serves the production build and proxies /api to Render.
 * Usage: node preview-server.js
 */
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 4000;
const DIST = path.join(__dirname, "dist");
// Default to local backend, but allow override via environment variable
const API_TARGET = process.env.API_TARGET || "http://localhost:8080";

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function proxyRequest(req, res) {
  const targetUrl = new URL(req.url, API_TARGET);
  
  // Choose http or https based on the target URL
  const client = targetUrl.protocol === "https:" ? https : http;
  const targetPort = targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80);

  const options = {
    hostname: targetUrl.hostname,
    port: targetPort,
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetUrl.host, // Use host instead of hostname to include port if needed
    },
  };
  // Remove headers that break the proxy
  delete options.headers["origin"];
  delete options.headers["referer"];

  const proxyReq = client.request(options, (proxyRes) => {
    // Remove CORS headers from backend — not needed since we're same-origin
    const headers = { ...proxyRes.headers };
    delete headers["access-control-allow-origin"];
    delete headers["access-control-allow-credentials"];

    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Backend unreachable", detail: err.message }));
  });

  req.pipe(proxyReq, { end: true });
}

function serveStatic(req, res) {
  let filePath = path.join(DIST, url.parse(req.url).pathname);

  // If it's a directory or doesn't exist, serve index.html (SPA fallback)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, "index.html");
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api")) {
    proxyRequest(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Preview server running at:`);
  console.log(`    Local:   http://localhost:${PORT}/`);

  const nets = require("os").networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const addr of iface) {
      if (addr.family === "IPv4" && !addr.internal) {
        console.log(`    Network: http://${addr.address}:${PORT}/`);
      }
    }
  }

  console.log(`\n  API proxy: /api/* → ${API_TARGET}/api/*\n`);
});
