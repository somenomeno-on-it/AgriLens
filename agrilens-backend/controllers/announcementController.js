const Announcement = require("../models/Announcement");
const Admin = require("../models/Admin");

/**
 * POST /api/admin/announcements
 * Create a new announcement (admin only).
 */
async function createAnnouncement(req, res) {
  try {
    const { title, body, targetAudience, targetDistrict, targetUpazila } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ message: "Body is required" });
    }

    const validAudiences = ["all", "farmers", "agents", "region"];
    if (!validAudiences.includes(targetAudience)) {
      return res.status(400).json({ message: "Invalid targetAudience" });
    }

    if (targetAudience === "region" && (!targetDistrict || !targetUpazila)) {
      return res
        .status(400)
        .json({ message: "targetDistrict and targetUpazila are required for region audience" });
    }

    const adminId = req.user?.id || "unknown_admin";

    // Try to get admin name
    let adminName = "Admin";
    const adminDoc = await Admin.findOne({ userId: adminId }).lean();
    if (adminDoc?.fullName) adminName = adminDoc.fullName;

    const announcement = await Announcement.create({
      title: title.trim(),
      body: body.trim(),
      targetAudience,
      targetDistrict: targetAudience === "region" ? targetDistrict.trim().toLowerCase() : null,
      targetUpazila: targetAudience === "region" ? targetUpazila.trim().toLowerCase() : null,
      adminId,
      adminName,
    });

    res.status(201).json(announcement);
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ message: "Failed to create announcement" });
  }
}

/**
 * GET /api/admin/announcements
 * List all announcements (admin only) — full history.
 */
async function listAdminAnnouncements(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [total, announcements] = await Promise.all([
      Announcement.countDocuments(),
      Announcement.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      data: announcements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    });
  } catch (err) {
    console.error("Error listing announcements:", err);
    res.status(500).json({ message: "Failed to list announcements" });
  }
}

/**
 * DELETE /api/admin/announcements/:id
 * Deactivate (soft-delete) an announcement.
 */
async function deactivateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }
    announcement.isActive = false;
    await announcement.save();
    res.json({ message: "Announcement deactivated", id: announcement._id });
  } catch (err) {
    console.error("Error deactivating announcement:", err);
    res.status(500).json({ message: "Failed to deactivate announcement" });
  }
}

/**
 * GET /api/announcements?role=farmer|agent|public&district=...&upazila=...
 * Public endpoint — returns active announcements relevant to the caller.
 */
async function getAnnouncementsForRole(req, res) {
  try {
    const role = (req.query.role || "").toLowerCase();
    const district = (req.query.district || "").toLowerCase().trim();
    const upazila = (req.query.upazila || "").toLowerCase().trim();

    // Build the OR filter for audience targeting
    const audienceFilter = [{ targetAudience: "all" }];

    if (role === "farmer") audienceFilter.push({ targetAudience: "farmers" });
    if (role === "agent") audienceFilter.push({ targetAudience: "agents" });

    // Region-targeted: include if district/upazila matches
    if (district || upazila) {
      const regionCondition = { targetAudience: "region" };
      if (district) regionCondition.targetDistrict = district;
      if (upazila) regionCondition.targetUpazila = upazila;
      audienceFilter.push(regionCondition);
    }

    const announcements = await Announcement.find({
      isActive: true,
      $or: audienceFilter,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json(announcements);
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
}

module.exports = {
  createAnnouncement,
  listAdminAnnouncements,
  deactivateAnnouncement,
  getAnnouncementsForRole,
};
