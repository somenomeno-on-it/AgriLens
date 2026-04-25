const mongoose = require("mongoose");

/**
 * SeasonalRule – agro-climatic crop/season rule for Bangladeshi upazilas.
 *
 * suitableMonths : 1-based month numbers (1 = Jan … 12 = Dec)
 * supportedUpazilas: list of upazila names (must match Farm.location.upazila values)
 */
const seasonalRuleSchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    suitableMonths: {
      type: [Number], // e.g. [11, 12, 1, 2]
      required: true,
      validate: {
        validator: (arr) =>
          Array.isArray(arr) &&
          arr.length > 0 &&
          arr.every((m) => m >= 1 && m <= 12),
        message: "suitableMonths must be an array of integers 1–12",
      },
    },
    supportedUpazilas: {
      type: [String], // e.g. ["Savar", "Dhamrai"]
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "supportedUpazilas must be a non-empty array",
      },
    },
    rationale: {
      type: String, // short human-readable explanation surfaced in the API
      default: "",
    },
  },
  { timestamps: true, autoIndex: false }
);

module.exports = mongoose.model("SeasonalRule", seasonalRuleSchema);
