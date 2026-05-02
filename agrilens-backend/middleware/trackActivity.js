const FarmerProfile = require("../models/FarmerProfile");
const Agent = require("../models/Agent");
const Admin = require("../models/Admin");
const Customer = require("../models/Customer");

/**
 * trackActivity middleware
 * Run AFTER requireAuth. Updates lastSeen on the correct model based on req.user.role.
 * Fully non-blocking — uses fire-and-forget (no await). The request continues instantly.
 */
function trackActivity(req, res, next) {
  const user = req.user;

  if (user && user.id) {
    const now = new Date();

    if (user.role === "farmer") {
      FarmerProfile.updateOne({ userId: user.id }, { $set: { lastSeen: now } })
        .exec()
        .catch(() => {}); // silently swallow errors — never block the request
    } else if (user.role === "agent") {
      Agent.updateOne({ userId: user.id }, { $set: { lastSeen: now } })
        .exec()
        .catch(() => {});
    } else if (user.role === "admin") {
      Admin.updateOne({ userId: user.id }, { $set: { lastSeen: now } })
        .exec()
        .catch(() => {});
    } else if (user.role === "customer") {
      Customer.updateOne({ userId: user.id }, { $set: { lastSeen: now } })
        .exec()
        .catch(() => {});
    }
  }

  // Always call next immediately — do not await the DB write
  next();
}

module.exports = trackActivity;
