const express = require("express");
const { requireAuth } = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const trackActivity = require("../middleware/trackActivity");
const {
  getComplaintsInbox,
  getComplaintsSummary,
  respondToComplaint,
  updateComplaintStatus,
} = require("../controllers/adminComplaintController");

const router = express.Router();

router.use(requireAuth, requireAdmin, trackActivity);

// GET /api/admin/complaints/summary
router.get("/complaints/summary", getComplaintsSummary);

// GET /api/admin/complaints?agentId=&status=&page=&limit=&sort=
router.get("/complaints", getComplaintsInbox);

// PATCH /api/admin/complaints/:id/respond
router.patch("/complaints/:id/respond", respondToComplaint);

// PATCH /api/admin/complaints/:id/status
router.patch("/complaints/:id/status", updateComplaintStatus);

module.exports = router;

