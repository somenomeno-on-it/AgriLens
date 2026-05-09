require("dotenv").config();
const AuthUser = require("./models/AuthUser");
const mongoose = require("mongoose");
const { getRoleDetails } = require("./controllers/authController");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const authUser = await AuthUser.findOne({ role: "agent" });
    if (!authUser) {
      console.log("No agent found");
      process.exit(0);
    }
    console.log("Found agent auth user:", authUser.email);
    
    // Simulate the login process that happens in authController.js
    const agent = require("./models/Agent");
    const roleDetails = await agent.findOne({ userId: authUser.userId })
      .select("fullName isSuspended email assignedRegions")
      .lean();
    
    console.log("Role details fetched:", roleDetails);

    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
});
