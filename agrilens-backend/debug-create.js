require("dotenv").config();
const mongoose = require("mongoose");
const Produce = require("./models/Produce");
const Farm = require("./models/Farm");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const farm = await Farm.findOne().lean();
    if (!farm) {
      console.log("No farms found");
      process.exit(0);
    }

    const newListing = await Produce.create({
      farmerId: "debug-farmer",
      farmId: farm._id,
      cropType: "Debug Crop",
      quantity: 100,
      initialQuantity: 100,
      unit: "kg",
      pricePerUnit: 50,
      status: "pending"
    });
    console.log("Created listing:", newListing._id);

    // Now try fetching the dashboard data directly using controller logic
    const { getScopedFarmAndFarmerMaps } = require("./controllers/agentDashboardController");
    // wait, getScopedFarmAndFarmerMaps is not exported, let's just copy the code
    const farmsList = await Farm.find({}).select("_id location farmerProfile").lean();
    const farmIds = farmsList.map(f => f._id);
    
    const listings = await Produce.find({
      farmId: { $in: farmIds },
      isRemoved: { $ne: true },
    }).sort({ createdAt: -1 }).select("cropType expectedHarvestDate pricePerUnit photos verificationStatus status farmId").lean();

    const data = listings.map((listing) => ({
      id: String(listing._id),
      produceName: listing.cropType || "",
      harvestDate: listing.expectedHarvestDate || null,
      price: listing.pricePerUnit ?? null,
      imageUrl: Array.isArray(listing.photos) && listing.photos.length ? listing.photos[0] : null,
      status: listing.verificationStatus || listing.status || "pending",
      farmerName: "Test Farmer",
    }));

    console.log("Dashboard mapped successfully, count:", data.length);
    
    // Cleanup
    await Produce.findByIdAndDelete(newListing._id);
    console.log("Cleaned up.");
    process.exit(0);

  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
});
