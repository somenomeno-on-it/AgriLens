const express = require("express");
const mockAuth = require("../middleware/mockAuth");
const requireAdmin = require("../middleware/requireAdmin");
const trackActivity = require("../middleware/trackActivity");
const { getAdminDashboard } = require("../controllers/adminDashboardController");
const { getAdminMetrics } = require("../controllers/adminMetricsController");
const {
  listUsers,
  getUserDetail,
  getFarmerListings,
  getAgentReviews,
  updateUserStatus,
  deleteUser,
} = require("../controllers/adminUserController");

const router = express.Router();

// Middleware chain: mockAuth populates req.user from headers (non-blocking),
// requireAdmin enforces the role === 'admin' gate (returns 403 otherwise),
// trackActivity updates lastSeen fire-and-forget for verified admins.
router.use(mockAuth, requireAdmin, trackActivity);

// GET /api/admin/dashboard
router.get("/dashboard", getAdminDashboard);

// GET /api/admin/metrics
router.get("/metrics", getAdminMetrics);

// User management
router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);
router.get("/users/:id", getUserDetail);
router.get("/farmers/:id/listings", getFarmerListings);
router.get("/agents/:id/reviews", getAgentReviews);

module.exports = router;
