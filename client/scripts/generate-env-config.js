const fs = require("fs");
const path = require("path");

const onRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PUBLIC_DOMAIN);
const apiUrl =
  process.env.REACT_APP_API_URL ||
  process.env.API_URL ||
  (onRailway ? "" : "http://localhost:5000");

const buildDir = path.join(__dirname, "..", "build");
const outFile = path.join(buildDir, "env-config.js");
const content = `window.__API_BASE__ = ${JSON.stringify(apiUrl)};\n`;

if (!fs.existsSync(buildDir)) {
  console.error("build/ folder missing — run npm run build first.");
  process.exit(1);
}

fs.writeFileSync(outFile, content);
console.log("Production API URL:", apiUrl || "(same origin — /api)");
