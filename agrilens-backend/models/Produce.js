const mongoose = require("mongoose");

const { Schema } = mongoose;

const produceSchema = new Schema(
  {
    farmerId: {
      type: String,
      required: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: "Farm",
      required: true,
    },
    cropType: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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
    quantity: {
      type: Number,
      required: true,
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
    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    photos: [
      {
        type: String,
      },
    ],
    grade: {
      type: String,
      trim: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    isRemoved: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("Produce", produceSchema);


