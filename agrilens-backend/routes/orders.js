const express = require("express");
const { placeOrder } = require("../controllers/orderController");
const { requireAuth, requireCustomer } = require("../middleware/auth");

const router = express.Router();

// POST /api/orders
router.post("/", requireAuth, requireCustomer, placeOrder);

module.exports = router;
