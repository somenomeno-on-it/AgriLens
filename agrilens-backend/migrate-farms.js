const mongoose = require("mongoose");
const Farm = require("./models/Farm");
const dotenv = require("dotenv");
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrilens";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.log("MongoDB connection error:", err);
    process.exit(1);
  });

async function migrateFarms() {
  try {
    const farms = await Farm.find({});
    console.log(`Found ${farms.length} farms to process.`);
    
    let updatedCount = 0;
    for (const farm of farms) {
      let lng = farm.location?.coordinates?.lng;
      let lat = farm.location?.coordinates?.lat;

      // If coordinates are missing, assign random coordinates in Bangladesh
      if (lng == null || lat == null) {
        // Approximate bounding box for Bangladesh
        // Lat: 20.5 to 26.5
        // Lng: 88.0 to 92.5
        lat = 20.5 + Math.random() * 6.0;
        lng = 88.0 + Math.random() * 4.5;
        
        farm.location = farm.location || {};
        farm.location.coordinates = { lat, lng };
      }

      farm.geoPoint = {
        type: "Point",
        coordinates: [lng, lat],
      };
      await farm.save();
      updatedCount++;
    }
    console.log(`Successfully updated ${updatedCount} farms with geoPoint.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrateFarms();
