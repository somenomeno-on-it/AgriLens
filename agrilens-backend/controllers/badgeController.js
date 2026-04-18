const FarmerProfile = require("../models/FarmerProfile");
const Produce = require("../models/Produce");

/**
 * GET /api/farmer/:id/badge-status  (public – no auth required)
 *
 * Returns the current badge status and supporting stats for any farmer.
 */
async function getBadgeStatus(req, res) {
  try {
    const { id } = req.params;

    const profile = await FarmerProfile.findOne({ userId: id })
      .select("userId verifiedBadge approvedListingCount")
      .lean();

    if (!profile) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    // Compute live approval rate for the response (not persisted here)
    const [approved, rejected] = await Promise.all([
      Produce.countDocuments({
        farmerId: id,
        verificationStatus: "approved",
        isRemoved: { $ne: true },
      }),
      Produce.countDocuments({
        farmerId: id,
        verificationStatus: "rejected",
        isRemoved: { $ne: true },
      }),
    ]);

    const total = approved + rejected;
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

    return res.json({
      farmerId: id,
      verifiedBadge: profile.verifiedBadge,
      approvedListingCount: profile.approvedListingCount,
      approvalRate,
    });
  } catch (err) {
    console.error("getBadgeStatus error:", err);
    return res.status(500).json({ message: "Failed to fetch badge status" });
  }
}

module.exports = { getBadgeStatus };
