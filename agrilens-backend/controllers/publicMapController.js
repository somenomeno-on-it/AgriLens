const Produce = require("../models/Produce");
const Farm = require("../models/Farm");

function normalizeProduceName(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

const DISTRICT_CENTERS = {
  dhaka: { lat: 23.8103, lng: 90.4125 },
  gazipur: { lat: 24.0023, lng: 90.4264 },
  narayanganj: { lat: 23.6238, lng: 90.5 },
  chattogram: { lat: 22.3569, lng: 91.7832 },
  sylhet: { lat: 24.8949, lng: 91.8687 },
  rajshahi: { lat: 24.3636, lng: 88.6241 },
  khulna: { lat: 22.8456, lng: 89.5403 },
  barishal: { lat: 22.701, lng: 90.3535 },
};

function stableHash(input) {
  const str = String(input || "");
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function normalizedJitter(seed, span = 0.12) {
  const normalized = (seed % 10000) / 10000; // 0..0.9999
  return (normalized - 0.5) * span; // -span/2..span/2
}

function hasValidCoordinates(value) {
  return (
    value &&
    typeof value.lat === "number" &&
    Number.isFinite(value.lat) &&
    typeof value.lng === "number" &&
    Number.isFinite(value.lng)
  );
}

function addAdminFallbackCoordinates(farm) {
  if (hasValidCoordinates(farm?.coordinates)) return farm;

  const districtKey = String(farm?.district || "").trim().toLowerCase();
  const base = DISTRICT_CENTERS[districtKey] || { lat: 23.685, lng: 90.3563 };
  const seed = stableHash(`${farm?.id || ""}|${farm?.farmName || ""}|${farm?.upazila || ""}`);

  const lat = base.lat + normalizedJitter(seed, 0.14);
  const lng = base.lng + normalizedJitter(Math.floor(seed / 7), 0.14);

  return {
    ...farm,
    coordinates: { lat, lng },
    coordinateSource: "fallback",
  };
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
        farmName: "$name",
        district: "$location.district",
        upazila: "$location.upazila",
        address: "$location.address",
        coordinates: {
          lat: {
            $ifNull: [
              {
                $convert: {
                  input: "$location.coordinates.lat",
                  to: "double",
                  onError: null,
                  onNull: null,
                },
              },
              {
                $convert: {
                  input: { $arrayElemAt: ["$geoPoint.coordinates", 1] },
                  to: "double",
                  onError: null,
                  onNull: null,
                },
              },
            ],
          },
          lng: {
            $ifNull: [
              {
                $convert: {
                  input: "$location.coordinates.lng",
                  to: "double",
                  onError: null,
                  onNull: null,
                },
              },
              {
                $convert: {
                  input: { $arrayElemAt: ["$geoPoint.coordinates", 0] },
                  to: "double",
                  onError: null,
                  onNull: null,
                },
              },
            ],
          },
        },
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
    const farmsWithCoordinates = farms.map(addAdminFallbackCoordinates);
    return res.json(farmsWithCoordinates);
  } catch (err) {
    console.error("[PUBLIC MAP] getPublicFarms error:", err);
    return res.status(500).json({ message: "Failed to fetch public farms" });
  }
}

async function getAdminMapFarms(req, res) {
  try {
    const { district, upazila, lat, lng, radius } = req.query;
    const produce = normalizeProduceName(req.query.produce);
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

    pipeline.push({
      $lookup: {
        from: "produces",
        let: { farmId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$farmId", "$$farmId"] },
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
    if (produce) {
      pipeline.push({ $match: { "produces.0": { $exists: true } } });
    }

    pipeline.push({
      $project: {
        _id: 0,
        id: "$_id",
        farmName: "$name",
        district: "$location.district",
        upazila: "$location.upazila",
        address: "$location.address",
        coordinates: {
          lat: {
            $ifNull: [
              {
                $convert: {
                  input: "$location.coordinates.lat",
                  to: "double",
                  onError: null,
                  onNull: null,
                },
              },
              {
                $convert: {
                  input: { $arrayElemAt: ["$geoPoint.coordinates", 1] },
                  to: "double",
                  onError: null,
                  onNull: null,
                },
              },
            ],
          },
          lng: {
            $ifNull: [
              {
                $convert: {
                  input: "$location.coordinates.lng",
                  to: "double",
                  onError: null,
                  onNull: null,
                },
              },
              {
                $convert: {
                  input: { $arrayElemAt: ["$geoPoint.coordinates", 0] },
                  to: "double",
                  onError: null,
                  onNull: null,
                },
              },
            ],
          },
        },
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

    pipeline.push({ $sort: { distance: 1, district: 1, upazila: 1, farmName: 1 } });

    const farms = await Farm.aggregate(pipeline);
    const farmsWithCoordinates = farms.map(addAdminFallbackCoordinates);
    return res.json(farmsWithCoordinates);
  } catch (err) {
    console.error("[PUBLIC MAP] getAdminMapFarms error:", err);
    return res.status(500).json({ message: "Failed to fetch admin map farms" });
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
  getAdminMapFarms,
  getProduceHeatmap,
  getPublicStats,
};

