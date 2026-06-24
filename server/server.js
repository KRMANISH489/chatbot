const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const propertiesRoute = require("./routes/properties");
const leadsRoute = require("./routes/leads");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/realestate", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Optional root route (optional)
app.get("/", (req, res) => {
  res.send("Real Estate API is running 🏡");
});

// Property routes
app.use("/api/properties", propertiesRoute);
app.use("/api/leads", leadsRoute);

// Server Start
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
