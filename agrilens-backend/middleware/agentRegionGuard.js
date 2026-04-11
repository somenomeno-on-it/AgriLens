const Farm = require("../models/Farm");
const Listing = require("../models/Listing");

async function verifyAgentRegion(req, res, next) {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId).select("farmId isRemoved");

    if (!listing || listing.isRemoved) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const farm = await Farm.findById(listing.farmId).select("location.upazila");
    const upazila = farm?.location?.upazila
      ? String(farm.location.upazila).trim().toLowerCase()
      : "";

    if (!upazila) {
      return res.status(400).json({ message: "Listing upazila is missing" });
    }

    const assignedRegions = Array.isArray(req.user?.assignedRegions)
      ? req.user.assignedRegions
      : [];

    if (!assignedRegions.length) {
      return res.status(403).json({ message: "Agent has no assigned regions" });
    }

    if (!assignedRegions.includes(upazila)) {
      return res
        .status(403)
        .json({ message: "Agent not assigned to listing region" });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ message: "Failed to verify agent region" });
  }
}

module.exports = {
  verifyAgentRegion,
};
