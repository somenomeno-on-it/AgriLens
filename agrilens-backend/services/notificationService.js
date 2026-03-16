const Notification = require("../models/Notification");

/**
 * Create a notification for a user.
 * Designed to be reused across controllers (e.g., Sprint 2 verification).
 */
async function createNotification({ userId, type, message, listingId }) {
  if (!userId) {
    throw new Error("userId is required");
  }
  if (!type) {
    throw new Error("type is required");
  }
  if (!message) {
    throw new Error("message is required");
  }

  const payload = {
    userId,
    type,
    message,
  };

  if (listingId) {
    payload.listingId = listingId;
  }

  return Notification.create(payload);
}

module.exports = {
  createNotification,
};

