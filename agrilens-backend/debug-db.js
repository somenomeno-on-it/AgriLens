require("dotenv").config();
const mongoose = require("mongoose");
const Farm = require("./models/Farm");
const Produce = require("./models/Produce");
const Agent = require("./models/Agent");
const FarmerProfile = require("./models/FarmerProfile");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrilens";

async function debug() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.\n");

  console.log("=== ALL AGENTS ===");
  const agents = await Agent.find().lean();
  agents.forEach(a => console.log(JSON.stringify(a, null, 2)));

  console.log("\n=== ALL FARMER PROFILES ===");
  const profiles = await FarmerProfile.find().lean();
  profiles.forEach(p => console.log(JSON.stringify(p, null, 2)));

  console.log("\n=== ALL FARMS ===");
  const farms = await Farm.find().lean();
  farms.forEach(f => console.log(JSON.stringify(f, null, 2)));

  console.log("\n=== ALL PRODUCE/LISTINGS ===");
  const produces = await Produce.find().lean();
  produces.forEach(p => console.log(`  id=${p._id} crop=${p.cropType} farmId=${p.farmId} farmerId=${p.farmerId} status=${p.verificationStatus}`));

  console.log("\nTotal farms:", farms.length);
  console.log("Total listings:", produces.length);

  process.exit(0);
}
debug().catch(e => { console.error(e); process.exit(1); });
