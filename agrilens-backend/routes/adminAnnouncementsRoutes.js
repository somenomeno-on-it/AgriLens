const express = require("express");
const { requireAuth } = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");
const trackActivity = require("../middleware/trackActivity");
const {
  createAnnouncement,
  listAdminAnnouncements,
  deactivateAnnouncement,
} = require("../controllers/announcementController");

const router = express.Router();

// All routes below require admin auth
router.use(requireAuth, requireAdmin, trackActivity);

// POST   /api/admin/announcements       — create a new announcement
router.post("/announcements", createAnnouncement);

// GET    /api/admin/announcements       — list all announcements (history)
router.get("/announcements", listAdminAnnouncements);

// DELETE /api/admin/announcements/:id  — deactivate an announcement
router.delete("/announcements/:id", deactivateAnnouncement);

module.exports = router;
