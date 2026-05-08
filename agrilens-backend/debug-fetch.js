require("dotenv").config();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Agent = require("./models/Agent");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const agent = await Agent.findOne().lean();
    if (!agent) {
      console.log("No agent found");
      process.exit(0);
    }

    const token = jwt.sign(
      { id: agent.userId, role: "agent" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "1d" }
    );

    const res = await fetch(`http://localhost:3001/api/agent/${agent.userId}/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-assigned-regions": JSON.stringify(agent.assignedRegions)
      }
    });

    const body = await res.text();
    console.log("STATUS:", res.status);
    console.log("BODY:", body.substring(0, 300) + (body.length > 300 ? "..." : ""));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});
