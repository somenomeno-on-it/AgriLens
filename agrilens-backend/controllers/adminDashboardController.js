const Produce = require("../models/Produce");
const Agent = require("../models/Agent");
const FarmerProfile = require("../models/FarmerProfile");
const Admin = require("../models/Admin");

/**
 * GET /api/admin/dashboard
 *
 * Returns:
 *  - activeUserCount   : users active in the last 24 hours across all roles
 *  - latestApprovedListings : 5 most recently approved produce listings
 *  - latestAgents      : 10 most recently created agents
 *
 * Assumptions:
 *  - "approved" status is tracked via Produce.status === 'approved'
 *  - approvedAt is derived from Produce.verifiedAt (set by verificationController when listing is approved)
 *  - Farm→FarmerProfile join done manually since farmerId is a plain String on Produce
 */
async function getAdminDashboard(req, res) {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // --- Run all three queries in parallel for performance ---
    const [
      activeFarmerCount,
      activeAgentCount,
      activeAdminCount,
      approvedListings,
      latestAgents,
    ] = await Promise.all([
      // Active farmers: FarmerProfile.lastSeen within 24h
      FarmerProfile.countDocuments({ lastSeen: { $gte: since24h } }),

      // Active agents: Agent.lastSeen within 24h
      Agent.countDocuments({ lastSeen: { $gte: since24h } }),

      // Active admins: Admin.lastSeen within 24h
      Admin.countDocuments({ lastSeen: { $gte: since24h } }),

      // Latest 5 approved listings, sorted by verifiedAt desc (verifiedAt === approvedAt)
      Produce.find({ status: "approved", isRemoved: { $ne: true } })
        .sort({ verifiedAt: -1 })
        .limit(5)
        .select("_id cropType farmerId verifiedAt")
        .lean(),

      // Latest 10 agents, sorted by createdAt desc
      Agent.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("fullName email bioUrl assignedRegions createdAt")
        .lean(),
    ]);

    const activeUserCount = activeFarmerCount + activeAgentCount + activeAdminCount;

    // Enrich approved listings with farmerName via FarmerProfile lookup
    let enrichedListings = [];
    if (approvedListings.length > 0) {
      const farmerIds = [...new Set(approvedListings.map((l) => String(l.farmerId)))];
      const farmerProfiles = await FarmerProfile.find({ userId: { $in: farmerIds } })
        .select("userId fullName")
        .lean();

      const farmerNameByUserId = new Map(
        farmerProfiles.map((fp) => [fp.userId, fp.fullName || "Unknown Farmer"])
      );

      enrichedListings = approvedListings.map((listing) => ({
        id: String(listing._id),
        produceName: listing.cropType || "",
        farmerName: farmerNameByUserId.get(String(listing.farmerId)) || "Unknown Farmer",
        approvedAt: listing.verifiedAt || null,
      }));
    }

    // Normalise agent shape — pull primary district from assignedRegions[0]
    const normalisedAgents = latestAgents.map((agent) => ({
      name: agent.fullName || "",
      email: agent.email || "",
      district:
        Array.isArray(agent.assignedRegions) && agent.assignedRegions.length > 0
          ? agent.assignedRegions[0].district || ""
          : "",
      bioUrl: agent.bioUrl || "",
      createdAt: agent.createdAt,
    }));

    return res.json({
      activeUserCount,
      latestApprovedListings: enrichedListings,
      latestAgents: normalisedAgents,
    });
  } catch (err) {
    console.error("[AdminDashboard] Error:", err);
    return res.status(500).json({ message: "Failed to load admin dashboard" });
  }
}

module.exports = { getAdminDashboard };
