require("dotenv").config();
const mongoose = require("mongoose");
const Agent = require("./models/Agent");
const Farm = require("./models/Farm");
const FarmerProfile = require("./models/FarmerProfile");
const Listing = require("./models/Listing"); // Actually maps to 'Produces' via Produce schema
const AuditLog = require("./models/AuditLog");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrilens";

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing dummy data if any (optional, but good for idempotency)
    await Agent.deleteOne({ userId: "demo-agent" });
    await FarmerProfile.deleteOne({ userId: "demo-farmer" });
    const oldFarms = await Farm.find({ "location.upazila": "demo-upazila" });
    const oldFarmIds = oldFarms.map(f => f._id);
    await Listing.deleteMany({ farmId: { $in: oldFarmIds } });
    await AuditLog.deleteMany({ agentId: "demo-agent" });
    await Farm.deleteMany({ _id: { $in: oldFarmIds } });

    console.log("Cleared old demo data.");

    // 1. Create Agent
    const agent = new Agent({
      userId: "demo-agent",
      fullName: "Demo Agent",
      assignedRegions: [
        { district: "demo-district", upazila: "demo-upazila" }
      ]
    });
    await agent.save();
    console.log("Created demo agent.");

    // 2. Create FarmerProfile
    const farmer = new FarmerProfile({
      userId: "demo-farmer",
      fullName: "Demo Farmer",
      phone: "01700000000",
      address: "Demo Address"
    });
    await farmer.save();
    console.log("Created demo farmer.");

    // 3. Create Farm
    const farm = new Farm({
      farmerProfile: farmer._id,
      name: "Demo Farm",
      location: {
        district: "demo-district",
        upazila: "demo-upazila"
      }
    });
    await farm.save();
    console.log("Created demo farm.");

    // 4. Create Listings (Produces)
    const pendingListing1 = new Listing({
      farmerId: "demo-farmer",
      farmId: farm._id,
      cropType: "Demo Rice",
      quantity: 100,
      unit: "kg",
      pricePerUnit: 50,
      verificationStatus: "pending",
      status: "pending",
      expectedHarvestDate: new Date(),
    });
    await pendingListing1.save();

    const pendingListing2 = new Listing({
      farmerId: "demo-farmer",
      farmId: farm._id,
      cropType: "Demo Wheat",
      quantity: 200,
      unit: "kg",
      pricePerUnit: 40,
      verificationStatus: "pending",
      status: "pending",
      expectedHarvestDate: new Date(),
    });
    await pendingListing2.save();

    const approvedListing = new Listing({
      farmerId: "demo-farmer",
      farmId: farm._id,
      cropType: "Demo Tomato",
      quantity: 50,
      unit: "kg",
      pricePerUnit: 30,
      verificationStatus: "approved",
      status: "approved",
      expectedHarvestDate: new Date(),
    });
    await approvedListing.save();

    const rejectedListing = new Listing({
      farmerId: "demo-farmer",
      farmId: farm._id,
      cropType: "Demo Potato",
      quantity: 500,
      unit: "kg",
      pricePerUnit: 20,
      verificationStatus: "rejected",
      status: "rejected",
      expectedHarvestDate: new Date(),
    });
    await rejectedListing.save();

    console.log("Created dummy listings.");

    // 5. Create AuditLogs for stats (Approved today, Rejected today)
    const today = new Date();
    
    // Approved today
    const audit1 = new AuditLog({
      agentId: "demo-agent",
      listingId: approvedListing._id,
      action: "approved",
      timestamp: today
    });
    await audit1.save();

    // Rejected today
    const audit2 = new AuditLog({
      agentId: "demo-agent",
      listingId: rejectedListing._id,
      action: "rejected",
      timestamp: today
    });
    await audit2.save();

    // Approved a week ago (to test 30d approval rate)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const audit3 = new AuditLog({
      agentId: "demo-agent",
      listingId: pendingListing1._id, // Just picking an ID for the sake of the log
      action: "approved",
      timestamp: lastWeek
    });
    await audit3.save();

    console.log("Created audit logs.");

    console.log("\n--- SEEDING COMPLETE ---");
    console.log("Go to: http://localhost:3000/agent/dashboard");
    console.log("Frontend will use fallback 'demo-agent' and 'demo-upazila' from localStorage.");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedData();
