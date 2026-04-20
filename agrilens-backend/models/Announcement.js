const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    // who sees this announcement
    targetAudience: {
      type: String,
      enum: ["all", "farmers", "agents", "region"],
      default: "all",
      required: true,
    },
    // only relevant when targetAudience === "region"
    targetDistrict: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    targetUpazila: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    adminId: {
      type: String,
      required: true,
      trim: true,
    },
    adminName: {
      type: String,
      trim: true,
      default: "Admin",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Announcement", announcementSchema);
