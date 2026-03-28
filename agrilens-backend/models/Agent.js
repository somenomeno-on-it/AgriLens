const mongoose = require("mongoose");

const assignedRegionSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    upazila: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  { _id: false }
);

const agentSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    bioUrl: {
      type: String,
      trim: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    assignedRegions: {
      type: [assignedRegionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agent", agentSchema);
