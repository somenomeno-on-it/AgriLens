const FarmerProfile = require("../models/FarmerProfile");
const Farm = require("../models/Farm");

async function getProfile(req, res) {
  try {
    const profile = await FarmerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
}

async function upsertProfile(req, res) {
  const { fullName, phone, address, nationalId, experienceYears } = req.body;

  try {
    let profile = await FarmerProfile.findOne({ userId: req.user.id });

    if (profile) {
      profile.fullName = fullName;
      profile.phone = phone;
      profile.address = address;
      profile.nationalId = nationalId;
      profile.experienceYears = experienceYears;
      await profile.save();
      return res.json(profile);
    }

    profile = await FarmerProfile.create({
      userId: req.user.id,
      fullName,
      phone,
      address,
      nationalId,
      experienceYears,
    });

    return res.status(201).json(profile);
  } catch (err) {
    return res.status(500).json({ message: "Failed to save profile" });
  }
}

async function getFarms(req, res) {
  try {
    const profile = await FarmerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const farms = await Farm.find({ farmerProfile: profile._id });
    return res.json(farms);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch farms" });
  }
}

async function createFarm(req, res) {
  const { name, location, sizeInAcres, description } = req.body;

  try {
    const profile = await FarmerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const geoPoint =
      location?.coordinates?.lng && location?.coordinates?.lat
        ? { type: "Point", coordinates: [location.coordinates.lng, location.coordinates.lat] }
        : undefined;

    const farm = await Farm.create({
      farmerProfile: profile._id,
      name,
      location,
      geoPoint,
      sizeInAcres,
      description,
    });

    return res.status(201).json(farm);
  } catch (err) {
    console.error("[createFarm] Error:", err.message, err.errors || "");
    return res.status(500).json({ message: "Failed to create farm", error: err.message });
  }
}

async function updateFarm(req, res) {
  const { id } = req.params;
  const { name, location, sizeInAcres, description } = req.body;

  try {
    const profile = await FarmerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const geoPoint =
      location?.coordinates?.lng && location?.coordinates?.lat
        ? { type: "Point", coordinates: [location.coordinates.lng, location.coordinates.lat] }
        : undefined;

    const farm = await Farm.findOneAndUpdate(
      { _id: id, farmerProfile: profile._id },
      { name, location, geoPoint, sizeInAcres, description },
      { new: true }
    );

    if (!farm) {
      return res.status(404).json({ message: "Farm not found" });
    }

    return res.json(farm);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update farm" });
  }
}

async function deleteFarm(req, res) {
  const { id } = req.params;

  try {
    const profile = await FarmerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const deleted = await Farm.findOneAndDelete({
      _id: id,
      farmerProfile: profile._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Farm not found" });
    }

    return res.json({ message: "Farm deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete farm" });
  }
}

module.exports = {
  getProfile,
  upsertProfile,
  getFarms,
  createFarm,
  updateFarm,
  deleteFarm,
};
