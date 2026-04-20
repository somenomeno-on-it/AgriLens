const express = require("express");
const { getAnnouncementsForRole } = require("../controllers/announcementController");

const router = express.Router();

// GET /api/announcements?role=farmer|agent&district=...&upazila=...
// No auth required — public endpoint
router.get("/", getAnnouncementsForRole);

module.exports = router;
