const Produce = require("../models/Produce");
const FarmerProfile = require("../models/FarmerProfile");

const BADGE_MIN_APPROVED = 20;
const BADGE_MIN_RATE = 80; // percent

/**
 * Recalculates the verifiedBadge and approvedListingCount for a farmer.
 *
 * Badge rule:
 *   - approvedListingCount >= 20
 *   - approvalRate (approved / (approved + rejected) * 100) >= 80%
 *   Badge is revoked if either condition drops below threshold.
 *
 * @param {string} farmerId  – the farmer's userId string (not ObjectId)
 * @returns {Promise<object|null>}  the updated FarmerProfile doc, or null if not found
 */
async function recalculateBadge(farmerId) {
  if (!farmerId) return null;

  const farmerIdStr = String(farmerId).trim();
  if (!farmerIdStr) return null;

  // Count approved and rejected listings (skip removed ones)
  const [approved, rejected] = await Promise.all([
    Produce.countDocuments({
      farmerId: farmerIdStr,
      verificationStatus: "approved",
      isRemoved: { $ne: true },
    }),
    Produce.countDocuments({
      farmerId: farmerIdStr,
      verificationStatus: "rejected",
      isRemoved: { $ne: true },
    }),
  ]);

  const total = approved + rejected;
  const approvalRate = total > 0 ? (approved / total) * 100 : 0;

  const earnsBadge =
    approved >= BADGE_MIN_APPROVED && approvalRate >= BADGE_MIN_RATE;

  const updated = await FarmerProfile.findOneAndUpdate(
    { userId: farmerIdStr },
    {
      $set: {
        approvedListingCount: approved,
        verifiedBadge: earnsBadge,
      },
    },
    { new: true }
  );

  return updated;
}

module.exports = { recalculateBadge };
