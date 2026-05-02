const mongoose = require("mongoose");

const { Schema } = mongoose;

const statusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "packaging",
        "out_for_delivery",
        "delivered",
        "rejected",
      ],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const customerContactSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    customerId: {
      type: String,
      ref: "Customer",
      required: true,
      index: true,
      trim: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
    farmerId: {
      type: String,
      ref: "FarmerProfile",
      required: true,
      index: true,
      trim: true,
    },
    produceName: {
      type: String,
      required: true,
      trim: true,
    },
    orderedQty: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    priceAtOrder: {
      type: Number,
      required: true,
      min: 0,
    },
    customerContact: {
      type: customerContactSchema,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "packaging",
        "out_for_delivery",
        "delivered",
        "rejected",
      ],
      default: "pending",
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    farmerNote: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

orderSchema.index({ farmerId: 1, status: 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
