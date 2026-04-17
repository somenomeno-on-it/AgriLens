const express = require("express");
const { requireAuth } = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const trackActivity = require("../middleware/trackActivity");
const {
  getFlaggedListings,
  getModerationLog,
  removeListing,
  reinstateListing,
} = require("../controllers/adminModerationController");

const router = express.Router();

router.use(requireAuth, requireAdmin, trackActivity);

router.get("/moderation/flagged", getFlaggedListings);
router.get("/moderation/log", getModerationLog);
router.delete("/listings/:id", removeListing);
router.patch("/listings/:id/reinstate", reinstateListing);

module.exports = router;
