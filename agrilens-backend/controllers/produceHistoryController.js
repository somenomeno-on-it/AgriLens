const ProduceHistory = require("../models/ProduceHistory");

function parseDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function requireSameFarmer(req, res) {
  const farmerId = req.params.id;
  if (farmerId !== req.user.id) {
    res.status(403).json({ message: "Forbidden" });
    return null;
  }
  return farmerId;
}

async function getProduceHistory(req, res) {
  try {
    const farmerId = requireSameFarmer(req, res);
    if (!farmerId) return;

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));

    const cropType = req.query.cropType ? String(req.query.cropType) : null;
    const statusTo = req.query.statusTo ? String(req.query.statusTo) : null;

    const startDate = parseDateOrNull(req.query.startDate);
    const endDate = parseDateOrNull(req.query.endDate);

    if ((req.query.startDate && !startDate) || (req.query.endDate && !endDate)) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    const match = {
      farmerId,
    };

    if (cropType && cropType !== "all") {
      match.cropType = cropType;
    }

    if (statusTo && statusTo !== "all") {
      match.statusTo = statusTo;
    }

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const [total, docs] = await Promise.all([
      ProduceHistory.countDocuments(match),
      ProduceHistory.find(match)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    const data = docs.map((d) => ({
      _id: d._id,
      produceId: d.produceId,
      farmId: d.farmId,
      cropType: d.cropType,
      statusFrom: d.statusFrom,
      statusTo: d.statusTo,
      unit: d.unit,
      pricePerUnit: d.pricePerUnit,
      quantity: d.quantity,
      initialQuantity: d.initialQuantity,
      soldQuantity: d.soldQuantity,
      reservedQuantity: d.reservedQuantity,
      description: d.description,
      expectedHarvestDate: d.expectedHarvestDate,
      availabilityStart: d.availabilityStart,
      availabilityEnd: d.availabilityEnd,
      changedAt: d.createdAt,
    }));

    return res.json({
      data,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch produce history" });
  }
}

async function getFarmerAnalytics(req, res) {
  try {
    const farmerId = requireSameFarmer(req, res);
    if (!farmerId) return;

    const cropType =
      req.query.cropType && String(req.query.cropType) !== "all"
        ? String(req.query.cropType)
        : null;

    const endDate = parseDateOrNull(req.query.endDate) || new Date();
    const startDate =
      parseDateOrNull(req.query.startDate) ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // default last 30 days

    if (startDate > endDate) {
      return res.status(400).json({ message: "startDate must be <= endDate" });
    }

    const match = {
      farmerId,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (cropType) {
      match.cropType = cropType;
    }

    // 1) Price trends: average price per day across all matching status snapshots.
    const priceAgg = await ProduceHistory.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            day: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
          avgPrice: { $avg: "$pricePerUnit" },
          pointCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id.day",
          price: "$avgPrice",
          pointCount: 1,
        },
      },
    ]);

    // 2) Quantity per crop: for each listing, take the most recent snapshot within range,
    // then sum quantity by cropType.
    const quantityAgg = await ProduceHistory.aggregate([
      { $match: match },
      { $sort: { produceId: 1, createdAt: -1 } },
      {
        $group: {
          _id: "$produceId",
          latest: { $first: "$$ROOT" },
        },
      },
      {
        $group: {
          _id: "$latest.cropType",
          quantity: { $sum: "$latest.quantity" },
          soldQuantity: { $sum: "$latest.soldQuantity" },
          reservedQuantity: { $sum: "$latest.reservedQuantity" },
          listingsCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          cropType: "$_id",
          quantity: 1,
          soldQuantity: 1,
          reservedQuantity: 1,
          listingsCount: 1,
        },
      },
      { $sort: { quantity: -1 } },
    ]);

    return res.json({
      meta: {
        farmerId,
        cropType: cropType || "all",
        startDate,
        endDate,
      },
      priceSeries: priceAgg.map((p) => ({
        date: p.date,
        price: typeof p.price === "number" ? p.price : Number(p.price || 0),
        pointCount: p.pointCount,
      })),
      quantityByCrop: quantityAgg.map((q) => ({
        cropType: q.cropType,
        quantity: q.quantity,
        soldQuantity: q.soldQuantity,
        reservedQuantity: q.reservedQuantity,
        listingsCount: q.listingsCount,
      })),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch analytics" });
  }
}

module.exports = {
  getProduceHistory,
  getFarmerAnalytics,
};

