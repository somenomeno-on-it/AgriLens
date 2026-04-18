const path = require("path");
const Complaint = require("../models/Complaint");
const Agent = require("../models/Agent");

// POST /api/complaints
// Creates a new complaint. farmerId is always taken from req.user (never client input).
async function createComplaint(req, res) {
  try {
    const { agentId, subject, description } = req.body;

    if (!agentId || !String(agentId).trim()) {
      return res.status(400).json({ message: "agentId is required" });
    }
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ message: "subject is required" });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ message: "description is required" });
    }

    // Validate the referenced agent actually exists
    const agent = await Agent.findOne({ userId: String(agentId).trim() }).lean();
    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const complaint = await Complaint.create({
      farmerId: req.user.id,
      agentId: String(agentId).trim(),
      subject: String(subject).trim(),
      description: String(description).trim(),
      status: "pending",
    });

    return res.status(201).json(complaint);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create complaint" });
  }
}

// GET /api/complaints
// Returns only the complaints belonging to the logged-in farmer, newest first.
async function getMyComplaints(req, res) {
  try {
    const complaints = await Complaint.find({ farmerId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // Attach agent fullName by looking up each unique agentId
    const uniqueAgentIds = [...new Set(complaints.map((c) => c.agentId))];
    const agents = await Agent.find({ userId: { $in: uniqueAgentIds } })
      .select("userId fullName email")
      .lean();

    const agentMap = {};
    agents.forEach((a) => {
      agentMap[a.userId] = a;
    });

    const enriched = complaints.map((c) => ({
      ...c,
      agent: agentMap[c.agentId] || null,
    }));

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch complaints" });
  }
}

// PATCH /api/complaints/:id
// Update subject/description only when status is still "pending".
async function updateComplaint(req, res) {
  try {
    const { id } = req.params;
    const { subject, description } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Ownership check — never trust client-provided farmerId
    if (complaint.farmerId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (complaint.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Cannot update a complaint that is no longer pending" });
    }

    if (subject != null) complaint.subject = String(subject).trim();
    if (description != null) complaint.description = String(description).trim();

    if (!complaint.subject) {
      return res.status(400).json({ message: "subject cannot be empty" });
    }
    if (!complaint.description) {
      return res.status(400).json({ message: "description cannot be empty" });
    }

    await complaint.save();
    return res.json(complaint);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update complaint" });
  }
}

// POST /api/complaints/:id/evidence
// Appends uploaded file paths to evidenceUrls[]. Max 3 files total across all uploads.
async function uploadEvidence(req, res) {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Ownership check
    if (complaint.farmerId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const MAX_EVIDENCE = 3;
    const remaining = MAX_EVIDENCE - complaint.evidenceUrls.length;
    if (remaining <= 0) {
      return res
        .status(400)
        .json({ message: "Evidence limit of 3 files already reached" });
    }

    // Reject the whole request if it would exceed the cumulative cap
    if (req.files.length > remaining) {
      return res.status(400).json({
        message: `You can only attach ${remaining} more file(s). This complaint already has ${complaint.evidenceUrls.length} of 3.`,
      });
    }

    const filesToAdd = req.files;
    const baseDir = path.join(__dirname, "..");

    const newPaths = filesToAdd.map((file) =>
      path.relative(baseDir, file.path).replace(/\\/g, "/")
    );

    complaint.evidenceUrls.push(...newPaths);
    await complaint.save();

    return res.json({
      message: "Evidence uploaded successfully",
      evidenceUrls: complaint.evidenceUrls,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to upload evidence" });
  }
}

module.exports = {
  createComplaint,
  getMyComplaints,
  updateComplaint,
  uploadEvidence,
};
