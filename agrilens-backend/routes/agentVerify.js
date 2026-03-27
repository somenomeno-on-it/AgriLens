const express = require("express");
const {
  verifyListing,
  getAgentQueue,
} = require("../controllers/verificationController");
const { requireAuth, requireAgent } = require("../middleware/auth");
const { verifyAgentRegion } = require("../middleware/agentRegionGuard");

const router = express.Router();

// PATCH /api/listings/:id/verify
router.patch("/listings/:id/verify", requireAuth, requireAgent, verifyAgentRegion, verifyListing);

// GET /api/agent/:id/queue?page=1&limit=10
router.get("/agent/:id/queue", requireAuth, requireAgent, getAgentQueue);

module.exports = router;
