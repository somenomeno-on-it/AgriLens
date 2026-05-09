require("dotenv").config();
const mongoose = require("mongoose");
const Produce = require("./models/Produce");
const Farm = require("./models/Farm");
const AuditLog = require("./models/AuditLog");

function startOfToday() {
  const dt = new Date();
  dt.setHours(0, 0, 0, 0);
  return dt;
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const upazilas = ["Mirpur", "Savar", "Dhamrai"];
    const regexUpazilas = upazilas.map(u => new RegExp(`^${u}$`, 'i'));
    const farms = await Farm.find({
      "location.upazila": { $in: regexUpazilas },
    }).select("_id").lean();

    const farmIds = farms.map((farm) => farm._id);
    if (!farmIds.length) {
      console.log("No farms");
      process.exit(0);
    }

    const [pendingCount, scopedListingIds] = await Promise.all([
      Produce.countDocuments({
        farmId: { $in: farmIds },
        verificationStatus: "pending",
        isRemoved: { $ne: true },
      }),
      Produce.find({
        farmId: { $in: farmIds },
        isRemoved: { $ne: true },
      })
        .select("_id")
        .lean(),
    ]);

    const listingIds = scopedListingIds.map((item) => item._id);
    const todayStart = startOfToday();
    const last30Start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const agentId = "mock-agent";

    const [approvedToday, rejectedToday, last30Summary] = await Promise.all([
      AuditLog.countDocuments({
        agentId,
        listingId: { $in: listingIds },
        action: "approved",
        timestamp: { $gte: todayStart },
      }),
      AuditLog.countDocuments({
        agentId,
        listingId: { $in: listingIds },
        action: "rejected",
        timestamp: { $gte: todayStart },
      }),
      AuditLog.aggregate([
        {
          $match: {
            agentId,
            listingId: { $in: listingIds },
            timestamp: { $gte: last30Start },
            action: { $in: ["approved", "rejected"] },
          },
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    console.log("Success! Stats:", { pendingCount, approvedToday, rejectedToday });
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
});
