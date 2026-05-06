const Produce = require("../models/Produce");
const ProduceHistory = require("../models/ProduceHistory");
const { createNotification } = require("../services/notificationService");

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
          .json({ message: "Expected Harvest Date must be in the future" });
      }
    }

    let parsedAvailabilityStart = null;
    if (availabilityStart) {
      parsedAvailabilityStart = new Date(availabilityStart);
      if (Number.isNaN(parsedAvailabilityStart.getTime())) {
        return res
          .status(400)
          .json({ message: "Availability Start Date is invalid" });
      }
    }

    let parsedAvailabilityEnd = null;
    if (availabilityEnd) {
      parsedAvailabilityEnd = new Date(availabilityEnd);
      if (Number.isNaN(parsedAvailabilityEnd.getTime())) {
        return res.status(400).json({ message: "Availability End Date is invalid" });
      }
    }

    if (
      parsedExpectedHarvestDate &&
      parsedAvailabilityStart &&
      parsedAvailabilityStart < parsedExpectedHarvestDate
    ) {
      return res.status(400).json({
        message:
          "Availability Start Date cannot be before Expected Harvest Date",
      });
    }

    if (
      parsedExpectedHarvestDate &&
      parsedAvailabilityEnd &&
      parsedAvailabilityEnd < parsedExpectedHarvestDate
    ) {
      return res.status(400).json({
        message: "Availability End Date cannot be before Expected Harvest Date",
      });
    }

    if (
      parsedAvailabilityStart &&
      parsedAvailabilityEnd &&
      parsedAvailabilityEnd < parsedAvailabilityStart
    ) {
      return res.status(400).json({
        message: "Availability End Date cannot be before Availability Start Date",
      });
    }

    const listing = await Produce.create({
      farmerId: req.user.id,
      farmId,
      cropType,
      description,
      expectedHarvestDate: parsedExpectedHarvestDate,
      availabilityStart: parsedAvailabilityStart,
      availabilityEnd: parsedAvailabilityEnd,
      quantity,
      initialQuantity: Number(quantity),
      unit,
      pricePerUnit,
      status: "pending",
      photos,
      grade,
    });

    // Create an initial snapshot so history/analytics include the starting "pending" state.
    try {
      await ProduceHistory.create({
        farmerId: req.user.id,
        produceId: listing._id,
        farmId: listing.farmId,
        cropType: listing.cropType,
        statusFrom: "pending",
        statusTo: listing.status,
        pricePerUnit: listing.pricePerUnit,
        quantity: listing.quantity,
        initialQuantity: listing.initialQuantity ?? listing.quantity,
        soldQuantity: listing.soldQuantity ?? 0,
        reservedQuantity: listing.reservedQuantity ?? 0,
        unit: listing.unit,
        expectedHarvestDate: listing.expectedHarvestDate,
        availabilityStart: listing.availabilityStart,
        availabilityEnd: listing.availabilityEnd,
        description: listing.description,
      });
    } catch (historyErr) {
      // Intentionally do not fail listing creation if history snapshot fails
    }

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
    console.error("[PRODUCE ERROR]:", err);
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

    const shouldFetchExisting =
      updates.status ||
      Object.prototype.hasOwnProperty.call(updates, "expectedHarvestDate") ||
      Object.prototype.hasOwnProperty.call(updates, "availabilityStart") ||
      Object.prototype.hasOwnProperty.call(updates, "availabilityEnd");

    let existing = null;
    let previousStatus = null;
    if (shouldFetchExisting) {
      existing = await Produce.findOne({
        _id: id,
        farmerId: req.user.id,
        isRemoved: { $ne: true },
      }).select("status cropType expectedHarvestDate availabilityStart availabilityEnd");

      if (!existing) {
        return res.status(404).json({ message: "Listing not found" });
      }

      previousStatus = existing.status;
    }

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

    if (updates.availabilityStart) {
      const parsed = new Date(updates.availabilityStart);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "availabilityStart is invalid" });
      }
      updates.availabilityStart = parsed;
    }

    if (updates.availabilityEnd) {
      const parsed = new Date(updates.availabilityEnd);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: "availabilityEnd is invalid" });
      }
      updates.availabilityEnd = parsed;
    }

    const effectiveExpectedHarvestDate = Object.prototype.hasOwnProperty.call(
      updates,
      "expectedHarvestDate"
    )
      ? updates.expectedHarvestDate
      : existing?.expectedHarvestDate;

    const effectiveAvailabilityStart = Object.prototype.hasOwnProperty.call(
      updates,
      "availabilityStart"
    )
      ? updates.availabilityStart
      : existing?.availabilityStart;

    const effectiveAvailabilityEnd = Object.prototype.hasOwnProperty.call(
      updates,
      "availabilityEnd"
    )
      ? updates.availabilityEnd
      : existing?.availabilityEnd;

    if (
      effectiveExpectedHarvestDate &&
      effectiveAvailabilityStart &&
      effectiveAvailabilityStart < effectiveExpectedHarvestDate
    ) {
      return res.status(400).json({
        message:
          "availabilityStart cannot be before expectedHarvestDate",
      });
    }

    if (
      effectiveExpectedHarvestDate &&
      effectiveAvailabilityEnd &&
      effectiveAvailabilityEnd < effectiveExpectedHarvestDate
    ) {
      return res.status(400).json({
        message: "availabilityEnd cannot be before expectedHarvestDate",
      });
    }

    if (
      effectiveAvailabilityStart &&
      effectiveAvailabilityEnd &&
      effectiveAvailabilityEnd < effectiveAvailabilityStart
    ) {
      return res.status(400).json({
        message: "availabilityEnd cannot be before availabilityStart",
      });
    }

    const listing = await Produce.findOneAndUpdate(
      { _id: id, farmerId: req.user.id, isRemoved: { $ne: true } },
      updates,
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (updates.status && previousStatus && previousStatus !== listing.status) {
      try {
        await createNotification({
          userId: req.user.id,
          type: "LISTING_STATUS_UPDATE",
          message: `Your listing "${listing.cropType}" status changed to "${listing.status}".`,
          listingId: listing._id,
        });
      } catch (notifyErr) {
        // Intentionally do not fail the request if notification creation fails
      }

      // Snapshot listing state on each status transition for later history/analytics.
      try {
        await ProduceHistory.create({
          farmerId: req.user.id,
          produceId: listing._id,
          farmId: listing.farmId,
          cropType: listing.cropType,
          statusFrom: previousStatus,
          statusTo: listing.status,
          pricePerUnit: listing.pricePerUnit,
          quantity: listing.quantity,
          initialQuantity: listing.initialQuantity ?? listing.quantity,
          soldQuantity: listing.soldQuantity ?? 0,
          reservedQuantity: listing.reservedQuantity ?? 0,
          unit: listing.unit,
          expectedHarvestDate: listing.expectedHarvestDate,
          availabilityStart: listing.availabilityStart,
          availabilityEnd: listing.availabilityEnd,
          description: listing.description,
        });
      } catch (historyErr) {
        // Intentionally do not fail the request if history snapshot creation fails
      }
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

// Update inventory for a listing (sold or reserved)
async function updateInventory(req, res) {
  try {
    const { listingId } = req.params;
    const { amount, type } = req.body;

    const numericAmount = Number(amount);

    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res
        .status(400)
        .json({ message: "amount must be a number greater than 0" });
    }

    if (type !== "sold" && type !== "reserved") {
      return res
        .status(400)
        .json({ message: 'type must be either "sold" or "reserved"' });
    }

    const listing = await Produce.findOne({
      _id: listingId,
      farmerId: req.user.id,
      isRemoved: { $ne: true },
    });

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Ensure initialQuantity is set for older documents
    if (listing.initialQuantity == null) {
      listing.initialQuantity = listing.quantity;
    }

    const available = listing.quantity;

    if (numericAmount > available) {
      return res
        .status(400)
        .json({ message: "amount exceeds available quantity" });
    }

    if (type === "sold") {
      listing.soldQuantity = (listing.soldQuantity || 0) + numericAmount;
    } else if (type === "reserved") {
      listing.reservedQuantity = (listing.reservedQuantity || 0) + numericAmount;
    }

    listing.quantity = available - numericAmount;

    if (listing.quantity < 0) {
      return res
        .status(400)
        .json({ message: "amount exceeds available quantity" });
    }

    await listing.save();

    return res.json({
      _id: listing._id,
      quantity: listing.quantity,
      initialQuantity: listing.initialQuantity,
      soldQuantity: listing.soldQuantity,
      reservedQuantity: listing.reservedQuantity,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update inventory" });
  }
}

module.exports = {
  createListing,
  getListingsByFarmer,
  getListingById,
  updateListing,
  deleteListing,
  updateInventory,
};


