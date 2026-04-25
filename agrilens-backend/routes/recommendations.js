const express = require("express");
const { getSeasonalRecommendations } = require("../controllers/recommendationController");
const { requireAuth, requireFarmer } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/recommendations?farmId=<id>
 * Protected: must be a logged-in farmer.
 */
router.get("/", requireAuth, requireFarmer, getSeasonalRecommendations);

module.exports = router;
