const express = require("express");
const FarmerProfile = require("../models/FarmerProfile");
const Farm = require("../models/Farm");
const { requireAuth, requireFarmer } = require("../middleware/auth");

const router = express.Router();

router.get("/profile", requireAuth, requireFarmer, async (req, res) => {
  try {
    const profile = await FarmerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

router.post("/profile", requireAuth, requireFarmer, async (req, res) => {
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

    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: "Failed to save profile" });
  }
});

router.get("/farms", requireAuth, requireFarmer, async (req, res) => {
  try {
    const profile = await FarmerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const farms = await Farm.find({ farmerProfile: profile._id });
    res.json(farms);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch farms" });
  }
});

router.post("/farms", requireAuth, requireFarmer, async (req, res) => {
  const { name, location, sizeInAcres, description } = req.body;

  try {
    const profile = await FarmerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const farm = await Farm.create({
      farmerProfile: profile._id,
      name,
      location,
      sizeInAcres,
      description,
    });

    res.status(201).json(farm);
  } catch (err) {
    res.status(500).json({ message: "Failed to create farm" });
  }
});

router.put("/farms/:id", requireAuth, requireFarmer, async (req, res) => {
  const { id } = req.params;
  const { name, location, sizeInAcres, description } = req.body;

  try {
    const profile = await FarmerProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const farm = await Farm.findOneAndUpdate(
      { _id: id, farmerProfile: profile._id },
      { name, location, sizeInAcres, description },
      { new: true }
    );

    if (!farm) {
      return res.status(404).json({ message: "Farm not found" });
    }

    res.json(farm);
  } catch (err) {
    res.status(500).json({ message: "Failed to update farm" });
  }
});

router.delete("/farms/:id", requireAuth, requireFarmer, async (req, res) => {
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

    res.json({ message: "Farm deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete farm" });
  }
});

module.exports = router;

