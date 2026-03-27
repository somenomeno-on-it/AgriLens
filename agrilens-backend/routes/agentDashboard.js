const express = require("express");
const { requireAuth, requireAgent } = require("../middleware/auth");
const { regionScope } = require("../middleware/regionScope");
const {
  getAgentDashboard,
  getAgentStats,
} = require("../controllers/agentDashboardController");

const router = express.Router();

router.get("/agent/:id/dashboard", requireAuth, requireAgent, regionScope, getAgentDashboard);
router.get("/agent/:id/stats", requireAuth, requireAgent, regionScope, getAgentStats);

module.exports = router;
