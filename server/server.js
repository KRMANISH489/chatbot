const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const propertiesRoute = require("./routes/properties");
const leadsRoute = require("./routes/leads");

const app = express();

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

app.get("/", (req, res) => {
  res.send("Real Estate API is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/properties", propertiesRoute);
app.use("/api/leads", leadsRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
