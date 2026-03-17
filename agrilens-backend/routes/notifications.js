const express = require("express");
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = require("../controllers/notificationController");
const { requireAuth, requireFarmer } = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications
router.get("/", requireAuth, requireFarmer, getNotifications);

// PATCH /api/notifications/read-all
router.patch("/read-all", requireAuth, requireFarmer, markAllNotificationsRead);

// PATCH /api/notifications/:id/read
router.patch("/:id/read", requireAuth, requireFarmer, markNotificationRead);

module.exports = router;

