const Produce = require("../models/Produce");

function normalizeProduceName(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

async function getPublicFarms(req, res) {
  try {
    const farms = await Produce.aggregate([
      {
        $match: {
          status: "approved",
          isRemoved: { $ne: true },
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
        $group: {
          _id: "$farm._id",
          farmName: { $first: "$farm.name" },
          district: { $first: "$farm.location.district" },
          upazila: { $first: "$farm.location.upazila" },
          coordinates: { $first: "$farm.location.coordinates" },
          farmerVerified: { $first: "$farmerProfile.verifiedBadge" },
          produceList: {
            $push: {
              produceName: "$cropType",
              quantity: "$quantity",
              harvestDate: "$expectedHarvestDate",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          farmName: 1,
          district: 1,
          upazila: 1,
          coordinates: 1,
          farmerVerified: 1,
          produceList: 1,
        },
      },
      { $sort: { farmName: 1 } },
    ]);

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
          cropType: produce,
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

module.exports = {
  getPublicFarms,
  getProduceHeatmap,
};

