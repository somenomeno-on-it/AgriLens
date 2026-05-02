const express = require("express");
const { requireAuth, requireCustomer } = require("../middleware/auth");
const {
  getCustomerProfile,
  updateCustomerProfile,
} = require("../controllers/customerController");

const router = express.Router();

// GET /api/customer/profile — fetch authenticated customer's profile
router.get("/profile", requireAuth, requireCustomer, getCustomerProfile);

// PUT /api/customer/profile — update name, phone, address
router.put("/profile", requireAuth, requireCustomer, updateCustomerProfile);

module.exports = router;
