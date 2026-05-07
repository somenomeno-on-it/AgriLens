const Produce = require("../models/Produce");
const AuditLog = require("../models/AuditLog");
const Admin = require("../models/Admin");
const { recalculateBadge } = require("../services/badgeService");

/**
 * GET /api/admin/moderation/flagged
 * Get all listings flagged by agents, pending admin review.
 */
async function getFlaggedListings(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { isFlagged: true, isRemoved: false };

    const [total, listings] = await Promise.all([
      Produce.countDocuments(filter),
      Produce.find(filter)
        .populate("farmerId", "fullName")
        .populate("farmId", "name location")
        .sort({ flaggedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      data: listings.map((l) => ({
        id: l._id,
        cropType: l.cropType,
        farmerId: l.farmerId,
        farm: l.farmId,
        quantity: l.quantity,
        unit: l.unit,
        pricePerUnit: l.pricePerUnit,
        status: l.status,
        photos: l.photos,
        flagReason: l.flagReason,
        flaggedBy: l.flaggedBy,
        flaggedAt: l.flaggedAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    });
  } catch (err) {
    console.error("Error fetching flagged listings:", err);
    res.status(500).json({ message: "Failed to fetch flagged listings" });
  }
}

/**
 * GET /api/admin/moderation/log
 * Get history of admin moderation actions (removals and reinstatements).
 */
async function getModerationLog(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { action: { $in: ["admin_remove_listing", "admin_reinstate_listing"] } };

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .populate("listingId", "cropType farmerId")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Fetch admin names for the logs
    const adminIds = [...new Set(logs.map(log => log.adminId).filter(Boolean))];
    const admins = await Admin.find({ userId: { $in: adminIds } }).select("userId fullName").lean();
    const adminMap = new Map(admins.map(a => [a.userId, a.fullName]));

    res.json({
      data: logs.map((log) => ({
        id: log._id,
        listingId: log.listingId?._id,
        cropType: log.listingId?.cropType || "Unknown",
        farmerId: log.listingId?.farmerId || "Unknown",
        adminId: log.adminId,
        adminName: adminMap.get(log.adminId) || "Unknown Admin",
        action: log.action,
        reason: log.reason,
        timestamp: log.timestamp,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    });
  } catch (err) {
    console.error("Error fetching moderation log:", err);
    res.status(500).json({ message: "Failed to fetch moderation log" });
  }
}

/**
 * DELETE /api/admin/listings/:id
 * Remove a listing with a mandatory reason.
 */
async function removeListing(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Removal reason is required" });
    }

    const listing = await Produce.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.isRemoved) {
      return res.status(400).json({ message: "Listing is already removed" });
    }

    listing.isRemoved = true;
    listing.status = "deleted";
    await listing.save();

    // Recalculate badge after removal (fire-and-forget)
    recalculateBadge(listing.farmerId).catch((err) =>
      console.error("recalculateBadge failed after admin removal:", err)
    );

    const adminId = req.user?.id || "unknown_admin";

    await AuditLog.create({
      listingId: listing._id,
      adminId,
      targetUserId: listing.farmerId,
      targetRole: "farmer",
      action: "admin_remove_listing",
      reason: reason.trim(),
      timestamp: new Date(),
    });

    res.json({ message: "Listing removed successfully", id: listing._id });
  } catch (err) {
    console.error("Error removing listing:", err);
    res.status(500).json({ message: "Failed to remove listing" });
  }
}

/**
 * PATCH /api/admin/listings/:id/dismiss-flag
 * Dismiss the flag on a listing without changing its status or reinstating it.
 */
async function dismissFlag(req, res) {
  try {
    const { id } = req.params;

    const listing = await Produce.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.isFlagged = false;
    listing.flagReason = undefined;
    listing.flaggedBy = undefined;
    listing.flaggedAt = undefined;

    await listing.save();

    res.json({ message: "Flag dismissed successfully", id: listing._id });
  } catch (err) {
    console.error("Error dismissing flag:", err);
    res.status(500).json({ message: "Failed to dismiss flag" });
  }
}

/**
 * PATCH /api/admin/listings/:id/reinstate
 * Reinstate a previously removed listing.
 */
async function reinstateListing(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
  
      const listing = await Produce.findById(id);
      if (!listing) {
        return res.status(404).json({ message: "Listing not found" });
      }
  
      if (!listing.isRemoved) {
        return res.status(400).json({ message: "Listing is not removed" });
      }
  
      listing.isRemoved = false;
      // Revert status to pending or original status logic might be needed here. 
      // Assuming 'pending' is safe.
      listing.status = "pending"; 
      // clear flag if reinstated
      listing.isFlagged = false;
      listing.flagReason = undefined; 
      listing.flaggedBy = undefined;
      listing.flaggedAt = undefined;

      await listing.save();

      // Recalculate badge after reinstatement (fire-and-forget)
      recalculateBadge(listing.farmerId).catch((err) =>
        console.error("recalculateBadge failed after reinstatement:", err)
      );

      const adminId = req.user?.id || "unknown_admin";
  
      await AuditLog.create({
        listingId: listing._id,
        adminId,
        targetUserId: listing.farmerId,
        targetRole: "farmer",
        action: "admin_reinstate_listing",
        reason: reason?.trim() || "Reinstated by admin",
        timestamp: new Date(),
      });
  
      res.json({ message: "Listing reinstated successfully", id: listing._id });
    } catch (err) {
      console.error("Error reinstating listing:", err);
      res.status(500).json({ message: "Failed to reinstate listing" });
    }
  }

module.exports = {
  getFlaggedListings,
  getModerationLog,
  removeListing,
  reinstateListing,
  dismissFlag,
};
