const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
      trim: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
    },
    adminId: {
      type: String,
      trim: true,
    },
    targetUserId: {
      type: String,
      trim: true,
    },
    targetRole: {
      type: String,
      enum: ["farmer", "agent"],
    },
    action: {
      type: String,
      enum: [
        "approved",
        "rejected",
        "admin_suspend",
        "admin_activate",
        "admin_delete_user",
        "admin_remove_listing",
        "admin_reinstate_listing",
        "agent_flag_listing",
      ],
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
