const Listing = require("../models/Listing");
const Farm = require("../models/Farm");
const AuditLog = require("../models/AuditLog");
const { createNotification } = require("../services/notificationService");
const mongoose = require("mongoose");

async function verifyListing(req, res) {
  try {
    const { id } = req.params;
    const { action, grade, feedback } = req.body;

    if (action !== "approved" && action !== "rejected") {
      return res
        .status(400)
        .json({ message: 'action must be either "approved" or "rejected"' });
    }

    const numericGrade = grade == null ? undefined : Number(grade);
    if (
      numericGrade != null &&
      (Number.isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100)
    ) {
      return res.status(400).json({ message: "grade must be between 0 and 100" });
    }

    // Always load full listing for updates + notifications (region middleware only loads farmId).
    const listing = await Listing.findById(id);
    if (!listing || listing.isRemoved) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.status = action;
    listing.verificationStatus = action;
    if (numericGrade != null) {
      listing.grade = numericGrade;
    }
    if (feedback != null) {
      listing.agentFeedback = String(feedback).trim();
    }
    listing.verifiedBy = mongoose.isValidObjectId(req.user.id) ? req.user.id : null;
    listing.verifiedAt = new Date();

    await listing.save();

    await AuditLog.create({
      agentId: req.user.id,
      listingId: listing._id,
      action,
      grade: numericGrade,
      feedback: feedback != null ? String(feedback).trim() : undefined,
      timestamp: new Date(),
    });

    const farmerNotifyId = listing.farmerId != null ? String(listing.farmerId).trim() : "";
    try {
      if (farmerNotifyId) {
        await createNotification({
          userId: farmerNotifyId,
          type: "LISTING_VERIFICATION_UPDATE",
          message: `Your listing "${listing.cropType}" was ${action}.`,
          listingId: listing._id,
        });
      }
    } catch (notifyErr) {
      console.error("createNotification failed after verification:", notifyErr);
    }

    return res.json(listing);
  } catch (err) {
    return res.status(500).json({ message: "Failed to verify listing" });
  }
}

async function getAgentQueue(req, res) {
  try {
    const { id } = req.params;
    if (!req.user || req.user.id !== id) {
      return res.status(403).json({ message: "Agent id mismatch" });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const assignedRegions = Array.isArray(req.user?.assignedRegions)
      ? req.user.assignedRegions
      : [];
    if (!assignedRegions.length) {
      return res.status(403).json({ message: "Agent has no assigned regions" });
    }

    const regexRegions = assignedRegions.map(r => new RegExp(`^${r}$`, 'i'));
    const farms = await Farm.find({
      "location.upazila": { $in: regexRegions },
    }).select("_id");

    const farmIds = farms.map((farm) => farm._id);
    if (!farmIds.length) {
      return res.json({
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const filter = {
      farmId: { $in: farmIds },
      status: "pending",
      isRemoved: { $ne: true },
    };

    const [total, listings] = await Promise.all([
      Listing.countDocuments(filter),
      Listing.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("farmId", "name location"),
    ]);

    return res.json({
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch verification queue" });
  }
}

async function flagListing(req, res) {
  try {
    const { id } = req.params;
    const { flagReason } = req.body;

    if (!flagReason || !flagReason.trim()) {
      return res.status(400).json({ message: "flagReason is required" });
    }

    const listing = await Listing.findById(id);
    if (!listing || listing.isRemoved) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.isFlagged = true;
    listing.flagReason = flagReason.trim();
    listing.flaggedBy = req.user.id;
    listing.flaggedAt = new Date();

    await listing.save();

    await AuditLog.create({
      agentId: req.user.id,
      listingId: listing._id,
      action: "agent_flag_listing",
      reason: flagReason.trim(),
      timestamp: new Date(),
    });

    return res.json({ message: "Listing flagged successfully", listing });
  } catch (err) {
    console.error("Failed to flag listing:", err);
    return res.status(500).json({ message: "Failed to flag listing" });
  }
}

module.exports = {
  verifyListing,
  getAgentQueue,
  flagListing,
};
