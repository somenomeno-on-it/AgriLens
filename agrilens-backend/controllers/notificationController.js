const Notification = require("../models/Notification");

// GET /api/notifications
async function getNotifications(req, res) {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .exec();

    return res.json(notifications);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
}

// PATCH /api/notifications/:id/read
async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json(notification);
  } catch (err) {
    return res.status(500).json({ message: "Failed to mark notification read" });
  }
}

// PATCH /api/notifications/read-all
async function markAllNotificationsRead(req, res) {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, isRead: { $ne: true } },
      { $set: { isRead: true } }
    );

    return res.json({
      message: "All notifications marked as read",
      matchedCount: result.matchedCount ?? result.n,
      modifiedCount: result.modifiedCount ?? result.nModified,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to mark all notifications read" });
  }
}

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

