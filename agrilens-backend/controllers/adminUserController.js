const mongoose = require("mongoose");
const FarmerProfile = require("../models/FarmerProfile");
const Agent = require("../models/Agent");
const Produce = require("../models/Produce");
const Listing = require("../models/Listing");
const AuditLog = require("../models/AuditLog");
const Complaint = require("../models/Complaint");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSearchFilter(search) {
  if (!search || !String(search).trim()) return null;
  const q = escapeRegex(String(search).trim());
  const rx = new RegExp(q, "i");
  return {
    $or: [{ fullName: rx }, { email: rx }, { userId: rx }],
  };
}

/**
 * GET /api/admin/users
 * Query: role=farmer|agent, search, page, limit
 */
async function listUsers(req, res) {
  try {
    const role = req.query.role ? String(req.query.role).toLowerCase() : null;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const searchFilter = buildSearchFilter(req.query.search);

    if (role === "farmer") {
      const filter = searchFilter ? { $and: [searchFilter] } : {};
      const [total, docs] = await Promise.all([
        FarmerProfile.countDocuments(filter),
        FarmerProfile.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);
      const userIds = docs.map((d) => d.userId);
      const listingCounts = await Produce.aggregate([
        { $match: { farmerId: { $in: userIds } } },
        { $group: { _id: "$farmerId", count: { $sum: 1 } } },
      ]);
      const countByFarmer = new Map(listingCounts.map((x) => [x._id, x.count]));

      const data = docs.map((d) => ({
        id: d.userId,
        name: d.fullName || "",
        email: d.email || "",
        role: "farmer",
        createdAt: d.createdAt,
        lastActive: d.lastSeen || d.createdAt,
        listingCount: countByFarmer.get(d.userId) || 0,
        reviewCount: 0,
        isSuspended: !!d.isSuspended,
      }));

      return res.json({
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
      });
    }

    if (role === "agent") {
      const filter = searchFilter ? { $and: [searchFilter] } : {};
      const [total, docs] = await Promise.all([
        Agent.countDocuments(filter),
        Agent.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);
      const userIds = docs.map((d) => d.userId);
      const reviewCounts = await AuditLog.aggregate([
        {
          $match: {
            agentId: { $in: userIds },
            action: { $in: ["approved", "rejected"] },
          },
        },
        { $group: { _id: "$agentId", count: { $sum: 1 } } },
      ]);
      const countByAgent = new Map(reviewCounts.map((x) => [x._id, x.count]));

      const data = docs.map((d) => ({
        id: d.userId,
        name: d.fullName || "",
        email: d.email || "",
        role: "agent",
        createdAt: d.createdAt,
        lastActive: d.lastSeen || d.createdAt,
        listingCount: 0,
        reviewCount: countByAgent.get(d.userId) || 0,
        isSuspended: !!d.isSuspended,
      }));

      return res.json({
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
      });
    }

    return res.status(400).json({
      message: 'Query "role" is required and must be "farmer" or "agent"',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to list users" });
  }
}

async function buildFarmerDetailResponse(farmer) {
  const id = farmer.userId;
  const [listingCount, statusBreakdown, complaints] = await Promise.all([
    Produce.countDocuments({ farmerId: id }),
    Produce.aggregate([
      { $match: { farmerId: id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Complaint.find({ farmerUserId: id }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  const breakdown = { pending: 0, approved: 0, rejected: 0, deleted: 0 };
  statusBreakdown.forEach((row) => {
    if (row._id && breakdown[row._id] !== undefined) {
      breakdown[row._id] = row.count;
    }
  });
  const totalForRate =
    (breakdown.approved || 0) + (breakdown.rejected || 0) || 1;
  const approvalRate = Math.round(
    ((breakdown.approved || 0) / totalForRate) * 100
  );

  return {
    role: "farmer",
    profile: {
      id: farmer.userId,
      name: farmer.fullName,
      email: farmer.email || "",
      phone: farmer.phone,
      address: farmer.address,
      nationalId: farmer.nationalId,
      experienceYears: farmer.experienceYears,
      createdAt: farmer.createdAt,
      lastActive: farmer.lastSeen || farmer.createdAt,
      isSuspended: !!farmer.isSuspended,
    },
    listingCount,
    approvalStats: {
      ...breakdown,
      approvalRate,
    },
    complaints: complaints.map((c) => ({
      id: c._id,
      subject: c.subject,
      body: c.body,
      status: c.status,
      createdAt: c.createdAt,
    })),
  };
}

async function buildAgentDetailResponse(agent) {
  const id = agent.userId;
  const [reviewAgg, recent] = await Promise.all([
    AuditLog.aggregate([
      {
        $match: {
          agentId: id,
          action: { $in: ["approved", "rejected"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$action", "approved"] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$action", "rejected"] }, 1, 0] },
          },
          avgGrade: { $avg: "$grade" },
        },
      },
    ]),
    AuditLog.find({ agentId: id })
      .sort({ timestamp: -1 })
      .limit(50)
      .populate("listingId", "cropType status")
      .lean(),
  ]);

  const stats = reviewAgg[0] || {
    total: 0,
    approved: 0,
    rejected: 0,
    avgGrade: null,
  };
  const denom = stats.approved + stats.rejected || 1;
  const approvalRate = Math.round((stats.approved / denom) * 100);

  return {
    role: "agent",
    profile: {
      id: agent.userId,
      name: agent.fullName,
      email: agent.email || "",
      bioUrl: agent.bioUrl,
      assignedRegions: agent.assignedRegions,
      createdAt: agent.createdAt,
      lastActive: agent.lastSeen || agent.createdAt,
      isSuspended: !!agent.isSuspended,
    },
    reviewStats: {
      totalReviews: stats.total || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0,
      averageGrade:
        stats.avgGrade != null ? Math.round(stats.avgGrade * 10) / 10 : null,
      approvalRate,
    },
    reviews: recent.map((r) => ({
      id: r._id,
      listingId: r.listingId,
      action: r.action,
      grade: r.grade,
      feedback: r.feedback,
      timestamp: r.timestamp,
    })),
  };
}

/**
 * GET /api/admin/users/:id
 * Query: role=farmer|agent (recommended)
 */
async function getUserDetail(req, res) {
  try {
    const { id } = req.params;
    const role = req.query.role ? String(req.query.role).toLowerCase() : null;

    if (role === "farmer") {
      const farmer = await FarmerProfile.findOne({ userId: id }).lean();
      if (!farmer) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(await buildFarmerDetailResponse(farmer));
    }

    if (role === "agent") {
      const agent = await Agent.findOne({ userId: id }).lean();
      if (!agent) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(await buildAgentDetailResponse(agent));
    }

    const farmer = await FarmerProfile.findOne({ userId: id }).lean();
    if (farmer) {
      return res.json(await buildFarmerDetailResponse(farmer));
    }
    const agent = await Agent.findOne({ userId: id }).lean();
    if (agent) {
      return res.json(await buildAgentDetailResponse(agent));
    }

    return res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load user" });
  }
}

/**
 * GET /api/admin/farmers/:id/listings
 */
async function getFarmerListings(req, res) {
  try {
    const { id } = req.params;
    const farmer = await FarmerProfile.findOne({ userId: id }).lean();
    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const breakdownAgg = await Produce.aggregate([
      { $match: { farmerId: id } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const breakdown = { pending: 0, approved: 0, rejected: 0, deleted: 0 };
    breakdownAgg.forEach((row) => {
      if (row._id && breakdown[row._id] !== undefined) {
        breakdown[row._id] = row.count;
      }
    });

    const listings = await Produce.find({ farmerId: id })
      .sort({ createdAt: -1 })
      .select(
        "cropType status quantity unit pricePerUnit farmId verificationStatus createdAt"
      )
      .populate("farmId", "name location")
      .lean();

    return res.json({
      farmerId: id,
      breakdown,
      listings: listings.map((l) => ({
        id: l._id,
        cropType: l.cropType,
        status: l.status,
        quantity: l.quantity,
        unit: l.unit,
        pricePerUnit: l.pricePerUnit,
        verificationStatus: l.verificationStatus,
        farm: l.farmId,
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load farmer listings" });
  }
}

/**
 * GET /api/admin/agents/:id/reviews
 */
async function getAgentReviews(req, res) {
  try {
    const { id } = req.params;
    const agent = await Agent.findOne({ userId: id }).lean();
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const [gradeStats, reviews] = await Promise.all([
      AuditLog.aggregate([
        {
          $match: {
            agentId: id,
            action: { $in: ["approved", "rejected"] },
          },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            avgGrade: { $avg: "$grade" },
            minGrade: { $min: "$grade" },
            maxGrade: { $max: "$grade" },
            approved: {
              $sum: { $cond: [{ $eq: ["$action", "approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$action", "rejected"] }, 1, 0] },
            },
          },
        },
      ]),
      AuditLog.find({ agentId: id })
        .sort({ timestamp: -1 })
        .populate("listingId", "cropType status farmerId")
        .lean(),
    ]);

    const g = gradeStats[0] || {};
    const denom = (g.approved || 0) + (g.rejected || 0) || 1;

    return res.json({
      agentId: id,
      gradeStats: {
        total: g.count || 0,
        averageGrade:
          g.avgGrade != null ? Math.round(g.avgGrade * 10) / 10 : null,
        minGrade: g.minGrade ?? null,
        maxGrade: g.maxGrade ?? null,
        approved: g.approved || 0,
        rejected: g.rejected || 0,
        approvalRate: Math.round(((g.approved || 0) / denom) * 100),
      },
      reviews: reviews.map((r) => ({
        id: r._id,
        listingId: r.listingId,
        action: r.action,
        grade: r.grade,
        feedback: r.feedback,
        timestamp: r.timestamp,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to load agent reviews" });
  }
}

async function logAdminAudit(req, payload) {
  const adminId = req.user && req.user.id ? String(req.user.id) : "unknown";
  return AuditLog.create({
    adminId,
    targetUserId: payload.targetUserId,
    targetRole: payload.targetRole,
    action: payload.action,
    timestamp: new Date(),
  });
}

/**
 * PATCH /api/admin/users/:id/status
 * Body: { status: 'active' | 'suspended' }
 */
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (status !== "active" && status !== "suspended") {
      return res.status(400).json({ message: 'status must be "active" or "suspended"' });
    }

    const isSuspended = status === "suspended";

    let farmer = await FarmerProfile.findOneAndUpdate(
      { userId: id },
      { $set: { isSuspended } },
      { new: true }
    );
    if (farmer) {
      await logAdminAudit(req, {
        targetUserId: id,
        targetRole: "farmer",
        action: isSuspended ? "admin_suspend" : "admin_activate",
      });
      return res.json({
        id: farmer.userId,
        role: "farmer",
        status: isSuspended ? "suspended" : "active",
        isSuspended: farmer.isSuspended,
      });
    }

    let agent = await Agent.findOneAndUpdate(
      { userId: id },
      { $set: { isSuspended } },
      { new: true }
    );
    if (agent) {
      await logAdminAudit(req, {
        targetUserId: id,
        targetRole: "agent",
        action: isSuspended ? "admin_suspend" : "admin_activate",
      });
      return res.json({
        id: agent.userId,
        role: "agent",
        status: isSuspended ? "suspended" : "active",
        isSuspended: agent.isSuspended,
      });
    }

    return res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to update status" });
  }
}

/**
 * DELETE /api/admin/users/:id
 * Query: role=farmer|agent (recommended)
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const role = req.query.role ? String(req.query.role).toLowerCase() : null;

    if (role === "farmer") {
      const farmer = await FarmerProfile.findOne({ userId: id });
      if (!farmer) {
        return res.status(404).json({ message: "Farmer not found" });
      }
      await Produce.updateMany(
        { farmerId: id },
        { $set: { status: "deleted", isRemoved: true } }
      );
      await FarmerProfile.deleteOne({ userId: id });
      await logAdminAudit(req, {
        targetUserId: id,
        targetRole: "farmer",
        action: "admin_delete_user",
      });
      return res.json({
        message: "Farmer account deleted",
        cascade: { listingsMarkedDeleted: true },
      });
    }

    if (role === "agent") {
      const agent = await Agent.findOne({ userId: id });
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      const agentId = agent._id;
      await Listing.updateMany(
        { verifiedBy: agentId },
        { $unset: { verifiedBy: 1 }, $set: { verifiedAt: null } }
      );
      await AuditLog.deleteMany({ agentId: id });
      await Agent.deleteOne({ _id: agent._id });
      await logAdminAudit(req, {
        targetUserId: id,
        targetRole: "agent",
        action: "admin_delete_user",
      });
      return res.json({
        message: "Agent account deleted",
        cascade: { listingsUnassigned: true, auditLogsRemoved: true },
      });
    }

    const farmer = await FarmerProfile.findOne({ userId: id });
    if (farmer) {
      await Produce.updateMany(
        { farmerId: id },
        { $set: { status: "deleted", isRemoved: true } }
      );
      await FarmerProfile.deleteOne({ userId: id });
      await logAdminAudit(req, {
        targetUserId: id,
        targetRole: "farmer",
        action: "admin_delete_user",
      });
      return res.json({
        message: "Farmer account deleted",
        cascade: { listingsMarkedDeleted: true },
      });
    }

    const agent = await Agent.findOne({ userId: id });
    if (agent) {
      await Listing.updateMany(
        { verifiedBy: agent._id },
        { $unset: { verifiedBy: 1 }, $set: { verifiedAt: null } }
      );
      await AuditLog.deleteMany({ agentId: id });
      await Agent.deleteOne({ _id: agent._id });
      await logAdminAudit(req, {
        targetUserId: id,
        targetRole: "agent",
        action: "admin_delete_user",
      });
      return res.json({
        message: "Agent account deleted",
        cascade: { listingsUnassigned: true, auditLogsRemoved: true },
      });
    }

    return res.status(404).json({ message: "User not found" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to delete user" });
  }
}

module.exports = {
  listUsers,
  getUserDetail,
  getFarmerListings,
  getAgentReviews,
  updateUserStatus,
  deleteUser,
};
