const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireAuth, requireFarmer } = require("../middleware/auth");
const Agent = require("../models/Agent");
const Listing = require("../models/Listing");
const {
  createComplaint,
  getMyComplaints,
  updateComplaint,
  uploadEvidence,
} = require("../controllers/complaintController");

const router = express.Router();

// ---- Evidence-specific multer config ----
// Accepts images (JPEG/PNG) and PDFs, max 10 MB each, stored under uploads/evidence/
const evidenceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, "..", "uploads", "evidence");
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || "";
    cb(null, "evidence-" + uniqueSuffix + ext);
  },
});

const evidenceFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("Invalid file type (only JPG, PNG, WEBP, PDF allowed)");
    err.code = "INVALID_FILE_TYPE";
    cb(err, false);
  }
};

const uploadEvidence3 = multer({
  storage: evidenceStorage,
  fileFilter: evidenceFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

// GET /api/complaints/agents  — public list of agents for the farmer complaint form
// Returns agents that have interacted with the logged in farmer's listings
router.get("/agents", requireAuth, requireFarmer, async (req, res) => {
  try {
    const listings = await Listing.find({ farmerId: String(req.user.id) })
      .select("verifiedBy")
      .lean();

    if (!listings || listings.length === 0) {
      return res.json([]);
    }

    const verifiedByIds = listings
      .map(l => l.verifiedBy)
      .filter(id => id != null);

    if (verifiedByIds.length === 0) {
      return res.json([]);
    }

    // Produce.verifiedBy references Agent._id (ObjectId)
    const uniqueAgentIds = [...new Set(verifiedByIds.map(id => String(id)))];

    const agents = await Agent.find({
      _id: { $in: uniqueAgentIds },
      isSuspended: { $ne: true }
    })
      .select("userId fullName email assignedRegions")
      .sort({ fullName: 1 })
      .lean();

    return res.json(agents);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch agents" });
  }
});

// POST /api/complaints
router.post("/", requireAuth, requireFarmer, createComplaint);

// GET /api/complaints
router.get("/", requireAuth, requireFarmer, getMyComplaints);

// PATCH /api/complaints/:id
router.patch("/:id", requireAuth, requireFarmer, updateComplaint);

// POST /api/complaints/:id/evidence  — max 3 files per request
router.post(
  "/:id/evidence",
  requireAuth,
  requireFarmer,
  uploadEvidence3.array("evidence", 3),
  // Catch multer errors (wrong type, oversized) and return consistent JSON
  (err, req, res, next) => {
    if (err) {
      let msg = err.message || "File upload error";
      if (err.code === "LIMIT_FILE_SIZE") msg = "File too large (max 10MB)";
      else if (err.code === "LIMIT_UNEXPECTED_FILE") msg = "Too many files uploaded";
      else if (err.code === "INVALID_FILE_TYPE") msg = "Invalid file type (only JPG, PNG, WEBP, PDF allowed)";
      
      return res.status(400).json({ message: msg });
    }
    next();
  },
  uploadEvidence
);

module.exports = router;
