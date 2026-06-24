const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const LEADS_FILE = path.join(__dirname, "../data_structure/leads.json");

router.post("/", (req, res) => {
  const { name, phone, email, region, searchCriteria } = req.body;

  if (!name?.trim() || !phone?.trim()) {
    return res.status(400).json({ error: "Name and phone are required" });
  }

  const phoneDigits = String(phone).replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return res.status(400).json({ error: "Please enter a valid phone number" });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }

  try {
    let leads = [];
    if (fs.existsSync(LEADS_FILE)) {
      leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
    }

    const entry = {
      id: Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || "",
      region: region || "IN",
      searchCriteria: searchCriteria || {},
      createdAt: new Date().toISOString(),
    };

    leads.push(entry);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
    res.json({ success: true, message: "Lead saved successfully" });
  } catch {
    res.status(500).json({ error: "Failed to save lead" });
  }
});

module.exports = router;
