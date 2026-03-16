const express = require("express");
const { updateInventory } = require("../controllers/produceController");
const { requireAuth, requireFarmer } = require("../middleware/auth");

const router = express.Router();

// PATCH /api/listings/:listingId/inventory
router.patch(
  "/:listingId/inventory",
  requireAuth,
  requireFarmer,
  updateInventory
);

module.exports = router;

