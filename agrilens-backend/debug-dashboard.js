require("dotenv").config();
const mongoose = require("mongoose");
const Produce = require("./models/Produce"); // Listing is Produce
const Farm = require("./models/Farm");

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const upazilas = ["Mirpur", "Savar", "Dhamrai"]; // mock some regions
    const regexUpazilas = upazilas.map(u => new RegExp(`^${u}$`, 'i'));
    const farms = await Farm.find({
      "location.upazila": { $in: regexUpazilas },
    }).select("_id location farmerProfile").lean();

    const farmIds = farms.map((farm) => farm._id);
    if (!farmIds.length) {
      console.log("No farms");
      process.exit(0);
    }

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
      farmerName: "Mock Farmer",
    }));

    console.log("Success! Rendered", data.length, "listings.");
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
});
