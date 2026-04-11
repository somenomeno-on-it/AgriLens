const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const farmerRoutes = require("./routes/farmer");
const produceRouter = require("./routes/produceRoutes");
const listingRoutes = require("./routes/listings");
const agentVerifyRoutes = require("./routes/agentVerify");
const agentDashboardRoutes = require("./routes/agentDashboard");
const notificationRoutes = require("./routes/notifications");
const adminRoutes = require("./routes/adminRoutes");
const adminAgentAssignRoutes = require("./routes/adminAgentAssign");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API is running");
});

// TEMPORARY DEBUG ENDPOINT - remove later
app.get("/api/debug", async (req, res) => {
  const Farm = require("./models/Farm");
  const Produce = require("./models/Produce");
  const Agent = require("./models/Agent");
  const FarmerProfile = require("./models/FarmerProfile");
  const farms = await Farm.find().lean();
  const listings = await Produce.find().select("cropType farmId farmerId verificationStatus status").lean();
  const agents = await Agent.find().lean();
  const profiles = await FarmerProfile.find().select("userId fullName").lean();
  res.json({ farms, listings, agents, profiles });
});

app.use("/api/farmer", farmerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/produce", produceRouter);
app.use("/api/listings", listingRoutes);
app.use("/api", agentVerifyRoutes);
app.use("/api", agentDashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminAgentAssignRoutes);

const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrilens";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  });