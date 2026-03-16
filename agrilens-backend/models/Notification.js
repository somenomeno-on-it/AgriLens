const mongoose = require("mongoose");

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Produce",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Notification", notificationSchema);

