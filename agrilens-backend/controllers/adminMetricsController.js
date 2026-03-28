const Produce = require("../models/Produce");
const FarmerProfile = require("../models/FarmerProfile");
const Agent = require("../models/Agent");
const cache = require("../utils/cache");

const CACHE_KEY = "admin:metrics";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/admin/metrics
 *
 * Returns platform-wide metrics, cached for 5 minutes.
 *
 * Response shape:
 * {
 *   totalListings,
 *   totalApproved,
 *   totalRejected,
 *   overallApprovalRate,   // percentage 0–100, 2 decimal places. 0 if no listings.
 *   activeFarmers,         // active in last 24h
 *   activeAgents,          // active in last 24h
 * }
 */
async function getAdminMetrics(req, res) {
  try {
    const metrics = await cache.getOrSet(CACHE_KEY, CACHE_TTL, async () => {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // All heavy queries run in parallel
      const [
        totalListings,
        totalApproved,
        totalRejected,
        activeFarmers,
        activeAgents,
      ] = await Promise.all([
        Produce.countDocuments({ isRemoved: { $ne: true } }),
        Produce.countDocuments({ status: "approved", isRemoved: { $ne: true } }),
        Produce.countDocuments({ status: "rejected", isRemoved: { $ne: true } }),
        FarmerProfile.countDocuments({ lastSeen: { $gte: since24h } }),
        Agent.countDocuments({ lastSeen: { $gte: since24h } }),
      ]);

      // Safe division — guard against zero
      const overallApprovalRate =
        totalListings > 0
          ? Number(((totalApproved / totalListings) * 100).toFixed(2))
          : 0;

      return {
        totalListings,
        totalApproved,
        totalRejected,
        overallApprovalRate,
        activeFarmers,
        activeAgents,
      };
    });

    return res.json(metrics);
  } catch (err) {
    console.error("[AdminMetrics] Error:", err);
    return res.status(500).json({ message: "Failed to load admin metrics" });
  }
}

module.exports = { getAdminMetrics };
