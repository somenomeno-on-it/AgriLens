const Produce = require("../models/Produce");
const Farm = require("../models/Farm");

function normalizeProduceName(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

async function getPublicFarms(req, res) {
  try {
    const { district, upazila, lat, lng, radius } = req.query;
    const produce = normalizeProduceName(req.query.produce);
    const pipeline = [];

    // 1. Spatial Filtering via $geoNear (MUST be first stage if used)
    if (lat && lng && radius) {
      pipeline.push({
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distance",
          maxDistance: parseFloat(radius) * 1000, // km to meters
          spherical: true,
        },
      });
    }

    // 2. Additional Matches
    const matchStage = {};
    if (district) matchStage["location.district"] = { $regex: new RegExp(`^${district}$`, "i") };
    if (upazila) matchStage["location.upazila"] = { $regex: new RegExp(`^${upazila}$`, "i") };

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // 3. Lookup FarmerProfile
    pipeline.push({
      $lookup: {
        from: "farmerprofiles",
        localField: "farmerProfile",
        foreignField: "_id",
        as: "farmerProfile",
      },
    });
    pipeline.push({ $unwind: "$farmerProfile" });
    pipeline.push({ $match: { "farmerProfile.isSuspended": { $ne: true } } });

    // 4. Lookup Produce
    pipeline.push({
      $lookup: {
        from: "produces",
        let: { farmId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$farmId", "$$farmId"] },
              status: "approved",
              isRemoved: { $ne: true },
            },
          },
          ...(produce
            ? [
                {
                  $match: {
                    cropType: { $regex: new RegExp(`^${produce}$`, "i") },
                  },
                },
              ]
            : []),
        ],
        as: "produces",
      },
    });

    // Only return farms that have valid produce listed
    pipeline.push({ $match: { "produces.0": { $exists: true } } });

    // 5. Format Output
    pipeline.push({
      $project: {
        _id: 0,
        id: "$_id",
        district: "$location.district",
        upazila: "$location.upazila",
        coordinates: "$location.coordinates",
        distance: 1,
        produceList: {
          $map: {
            input: "$produces",
            as: "p",
            in: {
              produceName: "$$p.cropType",
              quantity: "$$p.quantity",
              harvestDate: "$$p.expectedHarvestDate",
            },
          },
        },
      },
    });

    pipeline.push({ $sort: { distance: 1, district: 1, upazila: 1 } });

    const farms = await Farm.aggregate(pipeline);
    return res.json(farms);
  } catch (err) {
    console.error("[PUBLIC MAP] getPublicFarms error:", err);
    return res.status(500).json({ message: "Failed to fetch public farms" });
  }
}

async function getProduceHeatmap(req, res) {
  try {
    const produce = normalizeProduceName(req.query.produce);
    if (!produce) {
      return res
        .status(400)
        .json({ message: "produce query parameter is required" });
    }

    const points = await Produce.aggregate([
      {
        $match: {
          status: "approved",
          isRemoved: { $ne: true },
          cropType: { $regex: new RegExp(`^${produce}$`, "i") },
        },
      },
      {
        $lookup: {
          from: "farms",
          localField: "farmId",
          foreignField: "_id",
          as: "farm",
        },
      },
      { $unwind: "$farm" },
      {
        $lookup: {
          from: "farmerprofiles",
          localField: "farm.farmerProfile",
          foreignField: "_id",
          as: "farmerProfile",
        },
      },
      { $unwind: "$farmerProfile" },
      {
        $match: {
          "farmerProfile.isSuspended": { $ne: true },
        },
      },
      {
        $project: {
          _id: 0,
          lat: "$farm.location.coordinates.lat",
          lng: "$farm.location.coordinates.lng",
          quantity: "$quantity",
        },
      },
      {
        $match: {
          lat: { $type: "number" },
          lng: { $type: "number" },
        },
      },
      {
        $addFields: {
          gridLat: {
            $divide: [{ $floor: { $multiply: ["$lat", 10] } }, 10],
          },
          gridLng: {
            $divide: [{ $floor: { $multiply: ["$lng", 10] } }, 10],
          },
        },
      },
      {
        $group: {
          _id: { gridLat: "$gridLat", gridLng: "$gridLng" },
          intensity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          // center of the 0.1° cell
          lat: { $add: ["$_id.gridLat", 0.05] },
          lng: { $add: ["$_id.gridLng", 0.05] },
          intensity: 1,
        },
      },
    ]);

    return res.json(points);
  } catch (err) {
    console.error("[PUBLIC MAP] getProduceHeatmap error:", err);
    return res.status(500).json({ message: "Failed to fetch heatmap data" });
  }
}

async function getPublicStats(req, res) {
  try {
    const { district, upazila, lat, lng, radius } = req.query;

    let farmIds = null;
    if (district || upazila || (lat && lng && radius)) {
      const pipeline = [];
      if (lat && lng && radius) {
        pipeline.push({
          $geoNear: {
            near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
            distanceField: "distance",
            maxDistance: parseFloat(radius) * 1000,
            spherical: true,
          },
        });
      }
      const matchStage = {};
      if (district) matchStage["location.district"] = { $regex: new RegExp(`^${district}$`, "i") };
      if (upazila) matchStage["location.upazila"] = { $regex: new RegExp(`^${upazila}$`, "i") };
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }
      pipeline.push({ $project: { _id: 1 } });
      const matchingFarms = await Farm.aggregate(pipeline);
      farmIds = matchingFarms.map((f) => f._id);
    }

    const baseMatch = { status: "approved", isRemoved: { $ne: true } };
    if (farmIds) {
      baseMatch.farmId = { $in: farmIds };
    }

    // 1. Active Farm Count
    const activeFarmsCount = (
      await Produce.distinct("farmId", baseMatch)
    ).length;

    // 2. Top Crops
    const topCropsResult = await Produce.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: "$cropType",
          totalQuantity: { $sum: "$quantity" },
          farmCount: { $addToSet: "$farmId" },
        },
      },
      {
        $project: {
          cropType: "$_id",
          totalQuantity: 1,
          count: { $size: "$farmCount" },
          _id: 0,
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    // 3. Monthly Production Trends
    const trendMatch = { ...baseMatch, expectedHarvestDate: { $type: "date" } };
    const monthlyTrends = await Produce.aggregate([
      { $match: trendMatch },
      {
        $group: {
          _id: {
            month: { $month: "$expectedHarvestDate" },
            year: { $year: "$expectedHarvestDate" },
          },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    const formattedTrends = monthlyTrends.map((t) => {
      const date = new Date(t._id.year, t._id.month - 1);
      return {
        month: date.toLocaleString("default", { month: "short", year: "numeric" }),
        quantity: t.totalQuantity,
      };
    });

    return res.json({
      activeFarms: activeFarmsCount,
      topCrops: topCropsResult,
      monthlyTrends: formattedTrends,
    });
  } catch (err) {
    console.error("[PUBLIC MAP] getPublicStats error:", err);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
}

module.exports = {
  getPublicFarms,
  getProduceHeatmap,
  getPublicStats,
};

