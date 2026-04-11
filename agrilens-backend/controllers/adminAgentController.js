const Agent = require("../models/Agent");
const Farm = require("../models/Farm");
const Listing = require("../models/Listing");
const AuditLog = require("../models/AuditLog");

function normalizeRegionBody(body) {
  const district = body?.district != null ? String(body.district).trim().toLowerCase() : "";
  const upazila = body?.upazila != null ? String(body.upazila).trim().toLowerCase() : "";
  return { district, upazila };
}

/** Same pending-count logic as agent queue (verificationController). */
async function countPendingQueueForAgent(agentDoc) {
  const regions = Array.isArray(agentDoc?.assignedRegions) ? agentDoc.assignedRegions : [];
  if (!regions.length) return 0;

  const upazilas = regions
    .map((r) => String(r?.upazila || "").trim().toLowerCase())
    .filter(Boolean);
  if (!upazilas.length) return 0;

  const regexRegions = upazilas.map((u) => new RegExp(`^${u}$`, "i"));
  const farms = await Farm.find({
    "location.upazila": { $in: regexRegions },
  })
    .select("_id")
    .lean();

  const farmIds = farms.map((f) => f._id);
  if (!farmIds.length) return 0;

  return Listing.countDocuments({
    farmId: { $in: farmIds },
    status: "pending",
    isRemoved: { $ne: true },
  });
}

async function assignRegion(req, res) {
  try {
    const { id } = req.params;
    const { district, upazila } = normalizeRegionBody(req.body);

    if (!district || !upazila) {
      return res.status(400).json({ message: "district and upazila are required" });
    }

    const agent = await Agent.findOne({ userId: id });
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const exists = (agent.assignedRegions || []).some(
      (r) => r.district === district && r.upazila === upazila
    );
    if (exists) {
      return res.status(409).json({ message: "Region already assigned" });
    }

    agent.assignedRegions.push({ district, upazila });
    await agent.save();

    return res.json({
      message: "Region assigned",
      assignedRegions: agent.assignedRegions,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to assign region" });
  }
}

async function removeRegion(req, res) {
  try {
    const { id } = req.params;
    const { district, upazila } = normalizeRegionBody(req.body);

    if (!district || !upazila) {
      return res.status(400).json({ message: "district and upazila are required" });
    }

    const agent = await Agent.findOne({ userId: id });
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const before = (agent.assignedRegions || []).length;
    agent.assignedRegions = (agent.assignedRegions || []).filter(
      (r) => !(r.district === district && r.upazila === upazila)
    );

    if (agent.assignedRegions.length === before) {
      return res.status(404).json({ message: "Region not found on agent" });
    }

    await agent.save();

    return res.json({
      message: "Region removed",
      assignedRegions: agent.assignedRegions,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to remove region" });
  }
}

async function getAgentRegions(req, res) {
  try {
    const { id } = req.params;
    const agent = await Agent.findOne({ userId: id }).select("assignedRegions").lean();
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }
    return res.json({ assignedRegions: agent.assignedRegions || [] });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch regions" });
  }
}

async function getAgentPerformance(req, res) {
  try {
    const { id } = req.params;
    const agent = await Agent.findOne({ userId: id }).lean();
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const agentIdStr = String(id);

    const reviewMatch = {
      agentId: agentIdStr,
      action: { $in: ["approved", "rejected"] },
    };

    const [totalReviews, approvedCount, rejectedCount, gradeAgg] = await Promise.all([
      AuditLog.countDocuments(reviewMatch),
      AuditLog.countDocuments({ ...reviewMatch, action: "approved" }),
      AuditLog.countDocuments({ ...reviewMatch, action: "rejected" }),
      AuditLog.aggregate([
        { $match: { ...reviewMatch, grade: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgGrade: { $avg: "$grade" } } },
      ]),
    ]);

    const avgGrade =
      gradeAgg.length && gradeAgg[0].avgGrade != null
        ? Math.round(gradeAgg[0].avgGrade * 100) / 100
        : null;

    const totalDecided = approvedCount + rejectedCount;
    const approvalRate =
      totalDecided > 0 ? Math.round((approvedCount / totalDecided) * 10000) / 100 : 0;
    const rejectionRate =
      totalDecided > 0 ? Math.round((rejectedCount / totalDecided) * 10000) / 100 : 0;

    const pendingQueueSize = await countPendingQueueForAgent(agent);

    const since = new Date();
    since.setDate(since.getDate() - 30);
    since.setHours(0, 0, 0, 0);

    const dailyCounts = await AuditLog.aggregate([
      {
        $match: {
          agentId: agentIdStr,
          action: { $in: ["approved", "rejected"] },
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1 } },
    ]);

    const reviewsLast30Days = [];
    const rangeStart = new Date(since);
    for (let i = 0; i < 30; i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const found = dailyCounts.find((x) => x.date === key);
      reviewsLast30Days.push({ date: key, count: found ? found.count : 0 });
    }

    return res.json({
      totalReviews,
      avgGrade,
      approvalRate,
      rejectionRate,
      pendingQueueSize,
      reviewsLast30Days,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch agent performance" });
  }
}

async function getAgentsWorkload(req, res) {
  try {
    const threshold = Number(process.env.WORKLOAD_THRESHOLD);
    const workloadThreshold = Number.isFinite(threshold) && threshold > 0 ? threshold : 50;

    const agents = await Agent.find()
      .select("userId fullName email assignedRegions")
      .lean();

    const data = await Promise.all(
      agents.map(async (agent) => {
        const pendingQueueSize = await countPendingQueueForAgent(agent);
        return {
          userId: agent.userId,
          fullName: agent.fullName,
          email: agent.email,
          pendingQueueSize,
          overThreshold: pendingQueueSize > workloadThreshold,
        };
      })
    );

    return res.json({
      workloadThreshold,
      agents: data,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch workload" });
  }
}

module.exports = {
  assignRegion,
  removeRegion,
  getAgentRegions,
  getAgentPerformance,
  getAgentsWorkload,
};
