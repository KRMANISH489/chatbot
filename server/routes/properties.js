const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

router.post("/", (req, res) => {
  const { location, budget, bedrooms } = req.body;

  if (budget !== undefined && budget !== "") {
    const budgetNum = parseInt(budget, 10);
    if (Number.isNaN(budgetNum) || budgetNum < 0) {
      return res.status(400).json({ error: "Invalid budget value" });
    }
  }

  if (bedrooms !== undefined && bedrooms !== "") {
    const bedroomNum = parseInt(bedrooms, 10);
    if (Number.isNaN(bedroomNum) || bedroomNum < 1 || bedroomNum > 10) {
      return res.status(400).json({ error: "Invalid bedrooms value" });
    }
  }

  try {
    const basics = JSON.parse(fs.readFileSync(path.join(__dirname, "../data_structure/property_basics.json")));
    const characteristics = JSON.parse(fs.readFileSync(path.join(__dirname, "../data_structure/property_characteristics.json")));
    const images = JSON.parse(fs.readFileSync(path.join(__dirname, "../data_structure/property_images.json")));

    const merged = basics.map((basic) => {
      const char = characteristics.find(c => c.id === basic.id) || {};
      const image = images.find(i => i.id === basic.id) || {};
      return { ...basic, ...char, ...image };
    });

    const filtered = merged.filter(p =>
      (!location || p.location.toLowerCase().includes(String(location).toLowerCase())) &&
      (!budget || parseInt(p.price) <= parseInt(budget)) &&
      (!bedrooms || parseInt(p.bedrooms) === parseInt(bedrooms))
    );

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: "Failed to load properties" });
  }
});

module.exports = router;
