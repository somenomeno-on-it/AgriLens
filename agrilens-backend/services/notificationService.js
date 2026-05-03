const Notification = require("../models/Notification");
const Admin = require("../models/Admin");

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

/**
 * Create the same notification for all admins.
 */
async function createAdminNotifications({ type, message, listingId }) {
  if (!type) {
    throw new Error("type is required");
  }
  if (!message) {
    throw new Error("message is required");
  }

  const admins = await Admin.find().select("userId").lean();
  const adminIds = admins.map((a) => String(a.userId || "").trim()).filter(Boolean);
  if (!adminIds.length) return [];

  const docs = adminIds.map((userId) => ({
    userId,
    type,
    message,
    ...(listingId ? { listingId } : {}),
  }));

  return Notification.insertMany(docs);
}

/**
 * Notify a farmer that a customer placed a new order.
 */
async function createNewOrderNotificationForFarmer({
  farmerUserId,
  produceName,
  orderedQty,
  unit,
  customerPhone,
  customerAddress,
  listingId,
}) {
  return createNotification({
    userId: farmerUserId,
    type: "new_order",
    message: `New order for ${produceName}: ${orderedQty} ${unit}. Customer phone: ${customerPhone}. Address: ${customerAddress}.`,
    listingId,
  });
}

/**
 * Notify a customer that a farmer updated their order status.
 */
async function notifyCustomerOrderUpdate({
  customerUserId,
  status,
  produceName,
  orderedQty,
  unit,
}) {
  const statusLabel = status.replace(/_/g, " ");
  return createNotification({
    userId: customerUserId,
    type: "order_update",
    message: `Your order for ${produceName} (${orderedQty} ${unit}) has been updated to: ${statusLabel}.`,
  });
}

module.exports = {
  createNotification,
  createAdminNotifications,
  createNewOrderNotificationForFarmer,
  notifyCustomerOrderUpdate,
};

