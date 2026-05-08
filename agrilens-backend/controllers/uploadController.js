const path = require("path");
const Produce = require("../models/Produce");

async function uploadProducePhotos(req, res) {
  try {
    const { id } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files were uploaded" });
    }

    const listing = await Produce.findById(id);
    if (!listing) {
      return res.status(400).json({ message: "Listing not found" });
    }

    const baseDir = path.join(__dirname, "..");
    const photoPaths = req.files.map((file) => {
      const relativePath = path
        .relative(baseDir, file.path)
        .replace(/\\/g, "/");
      return relativePath;
    });

    const updatedListing = await Produce.findByIdAndUpdate(
      id,
      {
        $push: {
          photos: { $each: photoPaths },
        },
      },
      { new: true }
    );

    return res.status(200).json(updatedListing);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to upload photos", error: err.message });
  }
}

async function removeProducePhoto(req, res) {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ message: "photoUrl is required" });
    }

    const listing = await Produce.findOne({ _id: id, farmerId: req.user.id, isRemoved: { $ne: true } });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found or you don't have permission" });
    }

    const updatedListing = await Produce.findByIdAndUpdate(
      id,
      {
        $pull: { photos: photoUrl },
      },
      { new: true }
    );

    return res.status(200).json(updatedListing);
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to remove photo", error: err.message });
  }
}

module.exports = {
  uploadProducePhotos,
  removeProducePhoto,
};

