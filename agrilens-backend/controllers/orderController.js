const Listing = require("../models/Listing");
const Order = require("../models/Order");
const {
  createNewOrderNotificationForFarmer,
} = require("../services/notificationService");

async function placeOrder(req, res) {
  try {
    const { listingId, orderedQty, customerContact } = req.body;

    const qty = Number(orderedQty);
    if (Number.isNaN(qty) || qty <= 0) {
      return res
        .status(400)
        .json({ message: "orderedQty must be a number greater than 0" });
    }

    if (!customerContact?.phone || !customerContact?.address) {
      return res.status(400).json({
        message: "customerContact.phone and customerContact.address are required",
      });
    }

    const listing = await Listing.findOne({
      _id: listingId,
      status: "approved",
      isRemoved: { $ne: true },
    }).lean();

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (Number(listing.quantity) <= 0) {
      return res.status(400).json({ message: "Listing is out of stock" });
    }

    if (qty > Number(listing.quantity)) {
      return res.status(400).json({
        message: `orderedQty exceeds remaining quantity (${listing.quantity})`,
      });
    }

    const order = await Order.create({
      customerId: req.user.id,
      listingId: listing._id,
      farmerId: listing.farmerId,
      produceName: listing.cropType,
      orderedQty: qty,
      unit: listing.unit,
      priceAtOrder: listing.pricePerUnit,
      customerContact: {
        phone: String(customerContact.phone).trim(),
        address: String(customerContact.address).trim(),
      },
      status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date() }],
    });

    try {
      await createNewOrderNotificationForFarmer({
        farmerUserId: listing.farmerId,
        produceName: listing.cropType,
        orderedQty: qty,
        unit: listing.unit,
        customerPhone: customerContact.phone,
        customerAddress: customerContact.address,
        listingId: listing._id,
      });
    } catch (notifyErr) {
      // Do not fail order placement if notification creation fails.
    }

    return res.status(201).json(order);
  } catch (err) {
    return res.status(500).json({ message: "Failed to place order" });
  }
}

module.exports = {
  placeOrder,
};
