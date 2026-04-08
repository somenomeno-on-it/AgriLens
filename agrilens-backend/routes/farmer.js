const express = require("express");
const { requireAuth, requireFarmer } = require("../middleware/auth");
const {
  getProduceHistory,
  getFarmerAnalytics,
} = require("../controllers/produceHistoryController");
const {
  getProfile,
  upsertProfile,
  getFarms,
  createFarm,
  updateFarm,
  deleteFarm,
} = require("../controllers/farmerController");

const router = express.Router();

router.get("/profile", requireAuth, requireFarmer, getProfile);
router.post("/profile", requireAuth, requireFarmer, upsertProfile);
router.get("/farms", requireAuth, requireFarmer, getFarms);
router.post("/farms", requireAuth, requireFarmer, createFarm);
router.put("/farms/:id", requireAuth, requireFarmer, updateFarm);
router.delete("/farms/:id", requireAuth, requireFarmer, deleteFarm);

// GET /api/farmer/:id/history - paginated produce status history snapshots
router.get("/:id/history", requireAuth, requireFarmer, getProduceHistory);

// GET /api/farmer/:id/analytics - aggregation-based price trends + quantity summaries
router.get("/:id/analytics", requireAuth, requireFarmer, getFarmerAnalytics);

module.exports = router;

