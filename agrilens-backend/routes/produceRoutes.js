const express = require("express");
const {
  createListing,
  getListingsByFarmer,
  getListingById,
  updateListing,
  deleteListing,
} = require("../controllers/produceController");
const { uploadProducePhotos } = require("../controllers/uploadController");
const { upload } = require("../middleware/upload");
const { requireAuth, requireFarmer } = require("../middleware/auth");

const router = express.Router();

// POST /api/produce - create a new listing
// GET /api/produce - get all listings for the authenticated farmer
router
  .route("/")
  .post(requireAuth, requireFarmer, createListing)
  .get(requireAuth, requireFarmer, getListingsByFarmer);

// POST /api/produce/:id/photos - upload photos for a listing
router.post(
  "/:id/photos",
  requireAuth,
  requireFarmer,
  upload.array("photos", 5),
  uploadProducePhotos
);

// DELETE /api/produce/:id/photos - remove a specific photo
router.delete(
  "/:id/photos",
  requireAuth,
  requireFarmer,
  require("../controllers/uploadController").removeProducePhoto
);

// GET /api/produce/:id - get a specific listing
// PUT /api/produce/:id - update a listing
// DELETE /api/produce/:id - delete (soft delete) a listing
router
  .route("/:id")
  .get(requireAuth, requireFarmer, getListingById)
  .put(requireAuth, requireFarmer, updateListing)
  .delete(requireAuth, requireFarmer, deleteListing);

module.exports = router;


