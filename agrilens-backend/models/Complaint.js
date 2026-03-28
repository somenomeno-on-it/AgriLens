const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    farmerUserId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    body: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "resolved", "dismissed"],
      default: "open",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);
