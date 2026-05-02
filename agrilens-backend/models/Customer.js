const mongoose = require("mongoose");

const customerAddressSchema = new mongoose.Schema(
  {
    division: { type: String, trim: true, default: "" },
    district: { type: String, trim: true, default: "" },
    upazila: { type: String, trim: true, default: "" },
    details: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: customerAddressSchema,
      default: () => ({}),
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
