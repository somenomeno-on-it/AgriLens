const Listing = require("../models/Listing");
const FarmerProfile = require("../models/FarmerProfile");

function toPositiveNumber(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

async function getPublicListings(req, res) {
  try {
    const {
      crop,
      district,
      minPrice,
      maxPrice,
      minGrade,
      maxGrade,
      page = 1,
      limit = 20,
    } = req.query;

    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.max(1, parseInt(limit, 10) || 20);

    const query = {
      status: "approved",
      isRemoved: { $ne: true },
      quantity: { $gt: 0 },
    };

    if (crop) {
      query.cropType = { $regex: String(crop).trim(), $options: "i" };
    }

    const parsedMinPrice = minPrice != null ? toPositiveNumber(minPrice) : null;
    const parsedMaxPrice = maxPrice != null ? toPositiveNumber(maxPrice) : null;
    if (parsedMinPrice != null || parsedMaxPrice != null) {
      query.pricePerUnit = {};
      if (parsedMinPrice != null) query.pricePerUnit.$gte = parsedMinPrice;
      if (parsedMaxPrice != null) query.pricePerUnit.$lte = parsedMaxPrice;
    }

    const parsedMinGrade = minGrade != null ? toPositiveNumber(minGrade) : null;
    const parsedMaxGrade = maxGrade != null ? toPositiveNumber(maxGrade) : null;
    if (parsedMinGrade != null || parsedMaxGrade != null) {
      query.grade = {};
      if (parsedMinGrade != null) query.grade.$gte = parsedMinGrade;
      if (parsedMaxGrade != null) query.grade.$lte = parsedMaxGrade;
    }

    const listings = await Listing.find(query)
      .populate("farmId", "name location")
      .sort({ createdAt: -1 })
      .lean();

    const farmerIds = [...new Set(listings.map((listing) => String(listing.farmerId || "")))];

    const farmers = await FarmerProfile.find({
      userId: { $in: farmerIds },
      isSuspended: { $ne: true },
    })
      .select("userId verifiedBadge isSuspended")
      .lean();

    const farmerMap = new Map(farmers.map((f) => [String(f.userId), f]));
    const districtFilter = String(district || "").trim().toLowerCase();

    const visibleListings = listings
      .filter((listing) => {
        const farmer = farmerMap.get(String(listing.farmerId || ""));
        if (farmer?.isSuspended) return false;

        if (districtFilter) {
          const listingDistrict = String(listing?.farmId?.location?.district || "")
            .trim()
            .toLowerCase();
          if (listingDistrict !== districtFilter) return false;
        }

        return true;
      })
      .map((listing) => {
        const farmer = farmerMap.get(String(listing.farmerId || ""));
        return {
          id: listing._id,
          produceName: listing.cropType,
          category: listing.cropType,
          price: listing.pricePerUnit,
          unit: listing.unit,
          grade: listing.grade,
          availableQty: listing.quantity,
          remainingQty: listing.quantity,
          district: listing?.farmId?.location?.district || "",
          upazila: listing?.farmId?.location?.upazila || "",
          imageUrls: Array.isArray(listing.photos) ? listing.photos : [],
          farmName: listing?.farmId?.name || "",
          farmerBadge: !!farmer?.verifiedBadge,
          description: listing.description || "",
        };
      });

    const start = (numericPage - 1) * numericLimit;
    const paged = visibleListings.slice(start, start + numericLimit);

    return res.json({
      page: numericPage,
      limit: numericLimit,
      total: visibleListings.length,
      listings: paged,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch marketplace listings" });
  }
}

async function getPublicListingById(req, res) {
  try {
    const { id } = req.params;
    const listing = await Listing.findOne({
      _id: id,
      status: "approved",
      isRemoved: { $ne: true },
      quantity: { $gt: 0 },
    })
      .populate("farmId", "name location")
      .lean();

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const farmer = await FarmerProfile.findOne({
      userId: String(listing.farmerId || ""),
      isSuspended: { $ne: true },
    })
      .select("verifiedBadge isSuspended")
      .lean();

    if (!farmer || farmer.isSuspended) {
      return res.status(404).json({ message: "Listing not found" });
    }

    return res.json({
      id: listing._id,
      produceName: listing.cropType,
      category: listing.cropType,
      description: listing.description || "",
      price: listing.pricePerUnit,
      unit: listing.unit,
      grade: listing.grade,
      availableQty: listing.quantity,
      remainingQty: listing.quantity,
      district: listing?.farmId?.location?.district || "",
      upazila: listing?.farmId?.location?.upazila || "",
      farmName: listing?.farmId?.name || "",
      imageUrls: Array.isArray(listing.photos) ? listing.photos : [],
      farmerBadge: !!farmer.verifiedBadge,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch listing details" });
  }
}

module.exports = {
  getPublicListings,
  getPublicListingById,
};
