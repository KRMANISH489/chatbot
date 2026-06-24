const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const propertiesRoute = require("./routes/properties");
const leadsRoute = require("./routes/leads");

const app = express();
const clientBuildPath = path.join(__dirname, "../client/build");
const servesClient = fs.existsSync(path.join(clientBuildPath, "index.html"));

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.railway\.app$/.test(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(null, true);
    },
  })
);
app.use(express.json());

if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error:", err.message));
} else {
  console.log("MongoDB skipped — using JSON property data");
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/properties", propertiesRoute);
app.use("/api/leads", leadsRoute);

if (servesClient) {
  app.use(
    express.static(clientBuildPath, {
      setHeaders(res, filePath) {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    })
  );
  console.log("Serving React app from client/build");
} else {
  app.get("/", (req, res) => {
    res.send("Real Estate API is running");
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
