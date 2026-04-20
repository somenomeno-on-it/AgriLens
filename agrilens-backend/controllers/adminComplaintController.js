const Complaint = require("../models/Complaint");
const Agent = require("../models/Agent");
const { createNotification } = require("../services/notificationService");

function parseSort(sort) {
  const s = String(sort || "newest").toLowerCase();
  if (s === "oldest") return { createdAt: 1 };
  return { createdAt: -1 };
}

// GET /api/admin/complaints?agentId=&status=&page=&limit=&sort=newest|oldest
async function getComplaintsInbox(req, res) {
  try {
    const agentId = req.query.agentId ? String(req.query.agentId).trim() : "";
    const status = req.query.status ? String(req.query.status).trim() : "";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const sort = parseSort(req.query.sort);

    const filter = {};
    if (agentId) filter.agentId = agentId;
    if (status) filter.status = status;

    const [total, rows] = await Promise.all([
      Complaint.countDocuments(filter),
      Complaint.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    const uniqueAgentIds = [...new Set(rows.map((c) => c.agentId))];
    const agents = await Agent.find({ userId: { $in: uniqueAgentIds } })
      .select("userId fullName email")
      .lean();
    const agentMap = new Map(agents.map((a) => [a.userId, a]));

    const data = rows.map((c) => ({
      ...c,
      agent: agentMap.get(c.agentId) || null,
    }));

    return res.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch complaints" });
  }
}

// GET /api/admin/complaints/summary
async function getComplaintsSummary(req, res) {
  try {
    const thresholdRaw = Number(process.env.COMPLAINT_THRESHOLD);
    const threshold =
      Number.isFinite(thresholdRaw) && thresholdRaw > 0 ? thresholdRaw : 3;

    const counts = await Complaint.aggregate([
      { $group: { _id: "$agentId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const agentIds = counts.map((c) => c._id);
    const agents = await Agent.find({ userId: { $in: agentIds } })
      .select("userId fullName email")
      .lean();
    const agentMap = new Map(agents.map((a) => [a.userId, a]));

    const perAgent = counts.map((c) => ({
      agentId: c._id,
      count: c.count,
      flagged: c.count >= threshold,
      agent: agentMap.get(c._id) || null,
    }));

    return res.json({
      threshold,
      perAgent,
      flaggedAgentIds: perAgent.filter((x) => x.flagged).map((x) => x.agentId),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch complaints summary" });
  }
}

// PATCH /api/admin/complaints/:id/respond  body: {adminResponse, status: resolved|dismissed}
async function respondToComplaint(req, res) {
  try {
    const { id } = req.params;
    const adminResponse =
      req.body?.adminResponse != null ? String(req.body.adminResponse).trim() : "";
    const status = req.body?.status ? String(req.body.status).trim() : "";

    if (!adminResponse) {
      return res.status(400).json({ message: "adminResponse is required" });
    }
    if (status !== "resolved" && status !== "dismissed") {
      return res
        .status(400)
        .json({ message: 'status must be "resolved" or "dismissed"' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.adminResponse = adminResponse;
    complaint.status = status;
    await complaint.save();

    try {
      await createNotification({
        userId: complaint.farmerId,
        type: "COMPLAINT_ADMIN_RESPONSE",
        message: `Admin responded to your complaint "${complaint.subject}" (${status}).`,
      });
    } catch (notifyErr) {
      // Do not fail the response if notification fails.
    }

    return res.json(complaint);
  } catch (err) {
    return res.status(500).json({ message: "Failed to respond to complaint" });
  }
}

// PATCH /api/admin/complaints/:id/status  body: {status: under_review}
async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const status = req.body?.status ? String(req.body.status).trim() : "";
    if (status !== "under_review") {
      return res.status(400).json({ message: 'status must be "under_review"' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = "under_review";
    await complaint.save();
    return res.json(complaint);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update complaint status" });
  }
}

module.exports = {
  getComplaintsInbox,
  getComplaintsSummary,
  respondToComplaint,
  updateComplaintStatus,
};

