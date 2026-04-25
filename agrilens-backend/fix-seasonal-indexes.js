/**
 * Drop any bad indexes from SeasonalRules collection and re-create correct ones.
 * Run once: node fix-seasonal-indexes.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrilens";

async function fix() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const db = mongoose.connection.db;
  const col = db.collection("seasonalrules");

  // List all indexes
  const indexes = await col.indexes();
  console.log("Current indexes:", JSON.stringify(indexes, null, 2));

  // Drop any multikey compound index that touches both array fields
  for (const idx of indexes) {
    const keys = Object.keys(idx.key || {});
    if (idx.name !== "_id_" && keys.includes("suitableMonths") && keys.includes("supportedUpazilas")) {
      console.log(`Dropping bad compound index: ${idx.name}`);
      await col.dropIndex(idx.name);
    }
  }

  // Ensure the two separate single-field indexes exist
  await col.createIndex({ suitableMonths: 1 }, { name: "suitableMonths_1" });
  await col.createIndex({ supportedUpazilas: 1 }, { name: "supportedUpazilas_1" });
  console.log("Indexes are now correct.");

  await mongoose.disconnect();
}

fix().catch((e) => { console.error(e); process.exit(1); });
