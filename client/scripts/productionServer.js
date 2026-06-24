const express = require("express");
const path = require("path");
const fs = require("fs");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const buildDir = path.join(__dirname, "..", "build");
const port = process.env.PORT || 3000;
const apiBase = (process.env.REACT_APP_API_URL || process.env.API_URL || "").replace(/\/$/, "");

if (!fs.existsSync(path.join(buildDir, "index.html"))) {
  console.error("Missing build/index.html — run npm run build first.");
  process.exit(1);
}

const envConfig = `window.__API_BASE__ = ${JSON.stringify(apiBase)};\n`;
fs.writeFileSync(path.join(buildDir, "env-config.js"), envConfig);

if (apiBase) {
  const proxy = createProxyMiddleware({
    target: apiBase,
    changeOrigin: true,
  });
  app.use("/api", proxy);
  app.get("/health", proxy);
  console.log("Proxying /api and /health to", apiBase);
} else {
  console.warn(
    "REACT_APP_API_URL is not set. Use Railway Root Directory = server for full-stack deploy."
  );
}

app.use(
  express.static(buildDir, {
    setHeaders(res, filePath) {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  })
);

app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) {
    next();
    return;
  }
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(buildDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Frontend listening on port ${port}`);
});
