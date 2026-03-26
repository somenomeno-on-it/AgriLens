const mongoose = require("mongoose");
const { Schema } = mongoose;

const produceHistorySchema = new Schema(
  {
    farmerId: {
      type: String,
      required: true,
      index: true,
    },
    produceId: {
      type: Schema.Types.ObjectId,
      ref: "Produce",
      required: true,
      index: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: "Farm",
    },
    cropType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Snapshot transition metadata
    statusFrom: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: true,
    },
    statusTo: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      required: true,
    },

    // Snapshot listing state at the moment of the status change
    pricePerUnit: {
      type: Number,
      min: 0,
    },
    quantity: {
      type: Number,
      min: 0,
    },
    initialQuantity: {
      type: Number,
      min: 0,
    },
    soldQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      enum: ["kg", "ton", "quintal"],
      required: true,
    },

    expectedHarvestDate: {
      type: Date,
    },
    availabilityStart: {
      type: Date,
    },
    availabilityEnd: {
      type: Date,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("ProduceHistory", produceHistorySchema);

