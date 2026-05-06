const mongoose = require("mongoose");

const farmSchema = new mongoose.Schema(
  {
    farmerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerProfile",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    location: {
      district: {
        type: String,
        required: true,
      },
      upazila: {
        type: String,
        required: true,
      },
      address: {
        type: String,
      },
      coordinates: {
        lat: {
          type: Number,
        },
        lng: {
          type: Number,
        },
      },
    },
    sizeInAcres: {
      type: Number,
    },
    description: {
      type: String,
    },
    geoPoint: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  { timestamps: true }
);

farmSchema.index({ geoPoint: "2dsphere" }, { sparse: true });

module.exports = mongoose.model("Farm", farmSchema);

