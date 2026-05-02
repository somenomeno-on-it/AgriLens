const mongoose = require("mongoose");

const authUserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["farmer", "agent", "admin", "customer"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuthUser", authUserSchema);
