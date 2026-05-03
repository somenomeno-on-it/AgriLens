const express = require("express");
const {
  placeOrder,
  getCustomerOrders,
  getCustomerOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");
const { requireAuth, requireCustomer, requireFarmer } = require("../middleware/auth");

const router = express.Router();

// POST /api/orders — place a new order (customer)
router.post("/", requireAuth, requireCustomer, placeOrder);

// GET /api/orders — list own orders (customer)
router.get("/", requireAuth, requireCustomer, getCustomerOrders);

// GET /api/orders/:id — single order detail (customer, ownership enforced)
router.get("/:id", requireAuth, requireCustomer, getCustomerOrderById);

// PATCH /api/orders/:id/status — farmer or admin updates order status
router.patch(
  "/:id/status",
  requireAuth,
  (req, res, next) => {
    // Allow both farmer and admin roles
    if (req.user.role === "farmer" || req.user.role === "admin") return next();
    return res.status(403).json({ message: "Farmer or admin role required" });
  },
  updateOrderStatus
);

module.exports = router;
