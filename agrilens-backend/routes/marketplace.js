const express = require("express");
const {
  getPublicListings,
  getPublicListingById,
} = require("../controllers/marketplaceController");

const router = express.Router();

// GET /api/marketplace/listings
router.get("/listings", getPublicListings);
router.get("/listings/:id", getPublicListingById);

module.exports = router;
