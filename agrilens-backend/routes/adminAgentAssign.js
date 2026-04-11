const express = require("express");
const { requireAuth } = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const trackActivity = require("../middleware/trackActivity");
const {
  assignRegion,
  removeRegion,
  getAgentRegions,
  getAgentPerformance,
  getAgentsWorkload,
} = require("../controllers/adminAgentController");

const router = express.Router();

router.use(requireAuth, requireAdmin, trackActivity);

// Static path before :id routes
router.get("/agents/workload", getAgentsWorkload);

router.post("/agents/:id/assign-region", assignRegion);
router.delete("/agents/:id/region", removeRegion);
router.get("/agents/:id/regions", getAgentRegions);
router.get("/agents/:id/performance", getAgentPerformance);

module.exports = router;
