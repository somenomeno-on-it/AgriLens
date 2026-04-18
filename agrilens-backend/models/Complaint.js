const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    // String userId — consistent with Agent.userId / FarmerProfile.userId pattern
    farmerId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    agentId: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    evidenceUrls: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "dismissed"],
      default: "pending",
    },
    adminResponse: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound index for admin queries by agent + status
complaintSchema.index({ agentId: 1, status: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);
