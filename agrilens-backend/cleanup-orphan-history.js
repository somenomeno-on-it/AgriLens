/**
 * One-time cleanup: remove ProduceHistory records whose Produce listing
 * has already been deleted (orphaned history).
 *
 * Run once:  node cleanup-orphan-history.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const Produce = require("./models/Produce");
const ProduceHistory = require("./models/ProduceHistory");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/agrilens";

async function cleanup() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Get all unique produceIds referenced in ProduceHistory
  const referencedIds = await ProduceHistory.distinct("produceId");
  console.log(`Found ${referencedIds.length} unique produceId(s) in ProduceHistory.`);

  if (referencedIds.length === 0) {
    console.log("Nothing to clean up.");
    await mongoose.disconnect();
    return;
  }

  // Find which of those produceIds still exist in the Produce collection
  const existingIds = await Produce.find(
    { _id: { $in: referencedIds } },
    { _id: 1 }
  ).lean();
  const existingIdSet = new Set(existingIds.map((p) => String(p._id)));

  // The orphaned ones are those NOT in the existing set
  const orphanIds = referencedIds.filter(
    (id) => !existingIdSet.has(String(id))
  );

  console.log(`Orphaned produceId(s) with no matching listing: ${orphanIds.length}`);

  if (orphanIds.length === 0) {
    console.log("No orphaned history records found. Nothing to delete.");
    await mongoose.disconnect();
    return;
  }

  orphanIds.forEach((id) => console.log(`  - ${id}`));

  const result = await ProduceHistory.deleteMany({
    produceId: { $in: orphanIds },
  });

  console.log(`✅ Deleted ${result.deletedCount} orphaned ProduceHistory record(s).`);

  await mongoose.disconnect();
  console.log("Done. Disconnected.");
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
