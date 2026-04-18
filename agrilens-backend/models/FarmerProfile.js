const mongoose = require("mongoose");

const farmerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    nationalId: {
      type: String,
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    verifiedBadge: {
      type: Boolean,
      default: false,
    },
    approvedListingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FarmerProfile", farmerProfileSchema);

