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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Farm", farmSchema);

