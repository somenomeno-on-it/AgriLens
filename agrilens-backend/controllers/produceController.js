const Produce = require("../models/Produce");

// Create a new produce listing
// - status must start as 'pending'
// - farmerId is taken from req.user.id
// - validates cropType, quantity, expectedHarvestDate
async function createListing(req, res) {
  try {
    const {
      farmId,
      cropType,
      description,
      expectedHarvestDate,
      availabilityStart,
      availabilityEnd,
      quantity,
      unit,
      pricePerUnit,
      photos,
      grade,
    } = req.body;

    // Basic validation
    if (!cropType) {
      return res.status(400).json({ message: "cropType is required" });
    }

    if (quantity == null || Number(quantity) <= 0) {
      return res
        .status(400)
        .json({ message: "quantity must be greater than 0" });
    }

    let parsedExpectedHarvestDate = null;
    if (expectedHarvestDate) {
      parsedExpectedHarvestDate = new Date(expectedHarvestDate);
      if (Number.isNaN(parsedExpectedHarvestDate.getTime())) {
        return res
          .status(400)
          .json({ message: "expectedHarvestDate is invalid" });
      }
      const now = new Date();
      if (parsedExpectedHarvestDate <= now) {
        return res
          .status(400)
          .json({ message: "expectedHarvestDate must be in the future" });
      }
    }

    const listing = await Produce.create({
      farmerId: req.user.id,
      farmId,
      cropType,
      description,
      expectedHarvestDate: parsedExpectedHarvestDate,
      availabilityStart,
      availabilityEnd,
      quantity,
      unit,
      pricePerUnit,
      status: "pending",
      photos,
      grade,
    });

    return res.status(201).json(listing);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create listing" });
  }
}

// Get all listings for the authenticated farmer
async function getListingsByFarmer(req, res) {
  try {
    const listings = await Produce.find({
      farmerId: req.user.id,
      isRemoved: { $ne: true },
    }).populate("farmId", "name location");

    return res.json(listings);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch listings" });
  }
}

// Get a single listing by id (only if it belongs to the farmer)
async function getListingById(req, res) {
  try {
    const { id } = req.params;

    const listing = await Produce.findOne({
      _id: id,
      farmerId: req.user.id,
      isRemoved: { $ne: true },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    return res.json(listing);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch listing" });
  }
}

// Update an existing listing (only if it belongs to the farmer)
async function updateListing(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Validation if these fields are being updated
    if (updates.cropType === "" || updates.cropType == null) {
      return res.status(400).json({ message: "cropType is required" });
    }

    if (updates.quantity != null && Number(updates.quantity) <= 0) {
      return res
        .status(400)
        .json({ message: "quantity must be greater than 0" });
    }

    if (updates.expectedHarvestDate) {
      const parsed = new Date(updates.expectedHarvestDate);
      if (Number.isNaN(parsed.getTime())) {
        return res
          .status(400)
          .json({ message: "expectedHarvestDate is invalid" });
      }
      const now = new Date();
      if (parsed <= now) {
        return res
          .status(400)
          .json({ message: "expectedHarvestDate must be in the future" });
      }
      updates.expectedHarvestDate = parsed;
    }

    const listing = await Produce.findOneAndUpdate(
      { _id: id, farmerId: req.user.id, isRemoved: { $ne: true } },
      updates,
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    return res.json(listing);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update listing" });
  }
}

// Delete a listing (hard delete) if it belongs to the farmer
async function deleteListing(req, res) {
  try {
    const { id } = req.params;

    const listing = await Produce.findOneAndDelete({
      _id: id,
      farmerId: req.user.id,
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    return res.json({ message: "Listing deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete listing" });
  }
}

module.exports = {
  createListing,
  getListingsByFarmer,
  getListingById,
  updateListing,
  deleteListing,
};


