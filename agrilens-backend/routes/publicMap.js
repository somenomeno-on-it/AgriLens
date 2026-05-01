const express = require("express");
const {
  getPublicFarms,
  getProduceHeatmap,
  getPublicStats,
} = require("../controllers/publicMapController");

const router = express.Router();

// Public Map API (no auth)
// GET /api/public/farms
router.get("/farms", getPublicFarms);

// GET /api/public/heatmap?produce=...
router.get("/heatmap", getProduceHeatmap);

// GET /api/public/stats
router.get("/stats", getPublicStats);

module.exports = router;

