const Listing = require("../models/Listing");
const Farm = require("../models/Farm");
const AuditLog = require("../models/AuditLog");
const FarmerProfile = require("../models/FarmerProfile");

function startOfToday() {
  const dt = new Date();
  dt.setHours(0, 0, 0, 0);
  return dt;
}

async function getScopedFarmAndFarmerMaps(upazilas) {
  if (!upazilas.length) {
    return {
      farmIds: [],
      farmById: new Map(),
      farmerNameById: new Map(),
    };
  }

  const regexUpazilas = upazilas.map(u => new RegExp(`^${u}$`, 'i'));
  console.log('[DEBUG] Looking for farms with upazilas:', upazilas);
  const farms = await Farm.find({
    "location.upazila": { $in: regexUpazilas },
  })
    .select("_id location farmerProfile")
    .lean();
  console.log('[DEBUG] Farms found:', farms.length, farms.map(f => ({ id: f._id, upazila: f.location?.upazila })));

  const farmIds = farms.map((farm) => farm._id);
  const farmerProfileIds = farms
    .map((farm) => farm.farmerProfile)
    .filter(Boolean);
  const farmerProfiles = farmerProfileIds.length
    ? await FarmerProfile.find({ _id: { $in: farmerProfileIds } })
        .select("_id fullName")
        .lean()
    : [];

  const farmerNameByProfileId = new Map(
    farmerProfiles.map((profile) => [String(profile._id), profile.fullName || "Unknown Farmer"])
  );

  const farmerNameById = new Map(
    farms.map((farm) => [
      String(farm._id),
      farmerNameByProfileId.get(String(farm.farmerProfile)) || "Unknown Farmer",
    ])
  );

  const farmById = new Map(farms.map((farm) => [String(farm._id), farm]));

  return { farmIds, farmById, farmerNameById };
}

async function getAgentDashboard(req, res) {
  try {
    const upazilas = req.regionScope?.upazilas || [];
    const { farmIds, farmerNameById } = await getScopedFarmAndFarmerMaps(upazilas);

    if (!farmIds.length) {
      return res.json({ data: [] });
    }

    console.log('[DEBUG] Querying listings for farmIds:', farmIds.map(id => id.toString()));
    const listings = await Listing.find({
      farmId: { $in: farmIds },
      isRemoved: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .select("cropType expectedHarvestDate pricePerUnit photos verificationStatus status farmId")
      .lean();
    console.log('[DEBUG] Listings found:', listings.length, listings.map(l => ({ id: l._id, crop: l.cropType, farmId: l.farmId })));

    const data = listings.map((listing) => ({
      id: String(listing._id),
      produceName: listing.cropType || "",
      harvestDate: listing.expectedHarvestDate || null,
      price: listing.pricePerUnit ?? null,
      imageUrl: Array.isArray(listing.photos) && listing.photos.length ? listing.photos[0] : null,
      status: listing.verificationStatus || listing.status || "pending",
      farmerName: farmerNameById.get(String(listing.farmId)) || "Unknown Farmer",
    }));

    return res.json({ data });
  } catch (err) {
    console.error("[getAgentDashboard ERROR]:", err);
    return res.status(500).json({ message: "Failed to load dashboard listings", error: err.message });
  }
}

async function getAgentStats(req, res) {
  try {
    const upazilas = req.regionScope?.upazilas || [];
    const agentId = String(req.params.id);
    const { farmIds } = await getScopedFarmAndFarmerMaps(upazilas);

    if (!farmIds.length) {
      return res.json({
        pendingCount: 0,
        approvedToday: 0,
        rejectedToday: 0,
        approvalRate: 0,
      });
    }

    const [pendingCount, scopedListingIds] = await Promise.all([
      Listing.countDocuments({
        farmId: { $in: farmIds },
        verificationStatus: "pending",
        isRemoved: { $ne: true },
      }),
      Listing.find({
        farmId: { $in: farmIds },
        isRemoved: { $ne: true },
      })
        .select("_id")
        .lean(),
    ]);

    const listingIds = scopedListingIds.map((item) => item._id);
    if (!listingIds.length) {
      return res.json({
        pendingCount,
        approvedToday: 0,
        rejectedToday: 0,
        approvalRate: 0,
      });
    }

    const todayStart = startOfToday();
    const last30Start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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

    const approved30 = last30Summary.find((row) => row._id === "approved")?.count || 0;
    const rejected30 = last30Summary.find((row) => row._id === "rejected")?.count || 0;
    const total30 = approved30 + rejected30;
    const approvalRate = total30 ? Number(((approved30 / total30) * 100).toFixed(2)) : 0;

    return res.json({
      pendingCount,
      approvedToday,
      rejectedToday,
      approvalRate,
    });
  } catch (err) {
    console.error("[getAgentStats ERROR]:", err);
    return res.status(500).json({ message: "Failed to load dashboard stats", error: err.message });
  }
}

module.exports = {
  getAgentDashboard,
  getAgentStats,
};
