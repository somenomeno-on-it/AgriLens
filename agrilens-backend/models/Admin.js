const mongoose = require("mongoose");

/**
 * Admin model — separate from Farmer/Agent.
 * Identified by role = 'admin' in auth middleware headers.
 * lastSeen is updated by trackActivity middleware after each authenticated request.
 */
const adminSchema = new mongoose.Schema(
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
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
