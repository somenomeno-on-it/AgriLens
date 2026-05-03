const Listing = require("../models/Listing");
const Order = require("../models/Order");
const Customer = require("../models/Customer");
const {
  createNewOrderNotificationForFarmer,
  notifyCustomerOrderUpdate,
} = require("../services/notificationService");

// ─── Customer: place a new order ─────────────────────────────────────────────
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

// ─── Customer: list all own orders ───────────────────────────────────────────
async function getCustomerOrders(req, res) {
  try {
    const customerId = req.user.id; // always from JWT

    const orders = await Order.find({ customerId })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich each order with farmName and district from the listing
    const listingIds = [...new Set(orders.map((o) => String(o.listingId)))];
    const listings = await Listing.find({ _id: { $in: listingIds } })
      .populate("farmId", "name location")
      .lean();

    const listingMap = {};
    for (const l of listings) {
      listingMap[String(l._id)] = l;
    }

    const enriched = orders.map((o) => {
      const listing = listingMap[String(o.listingId)] || {};
      const farm = listing.farmId || {};
      return {
        _id: o._id,
        produceName: o.produceName,
        orderedQty: o.orderedQty,
        unit: o.unit,
        priceAtOrder: o.priceAtOrder,
        farmName: farm.name || "",
        district: farm.location?.district || "",
        status: o.status,
        statusHistory: o.statusHistory,
        farmerNote: o.farmerNote,
        createdAt: o.createdAt,
      };
    });

    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch orders" });
  }
}

// ─── Customer: single order detail ───────────────────────────────────────────
async function getCustomerOrderById(req, res) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ownership check
    if (String(order.customerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Enrich with farm info
    const listing = await Listing.findById(order.listingId)
      .populate("farmId", "name location")
      .lean();
    const farm = listing?.farmId || {};

    return res.json({
      ...order,
      farmName: farm.name || "",
      district: farm.location?.district || "",
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch order" });
  }
}

// ─── Farmer: paginated order inbox ───────────────────────────────────────────
async function getFarmerOrders(req, res) {
  try {
    // farmerId always from JWT — never trust the :id param for security
    const farmerId = req.user.id;

    const { status, page = 1 } = req.query;
    const PAGE_SIZE = 20;
    const skip = (Number(page) - 1) * PAGE_SIZE;

    const filter = { farmerId };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
      Order.countDocuments(filter),
    ]);

    // Enrich with customer name from Customer collection
    const customerIds = [...new Set(orders.map((o) => String(o.customerId)))];
    const customers = await Customer.find({ userId: { $in: customerIds } })
      .select("userId name phone")
      .lean();

    const customerMap = {};
    for (const c of customers) {
      customerMap[String(c.userId)] = c;
    }

    const enriched = orders.map((o) => {
      const cust = customerMap[String(o.customerId)] || {};
      return {
        ...o,
        customerName: cust.name || "—",
        customerPhone: o.customerContact?.phone || cust.phone || "—",
        deliveryAddress: o.customerContact?.address || "—",
      };
    });

    return res.json({
      orders: enriched,
      total,
      page: Number(page),
      pages: Math.ceil(total / PAGE_SIZE),
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch farmer orders" });
  }
}

// ─── Farmer / Admin: update order status ─────────────────────────────────────
const ALLOWED_STATUSES = [
  "confirmed",
  "packaging",
  "out_for_delivery",
  "delivered",
  "rejected",
];

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, farmerNote } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${ALLOWED_STATUSES.join(", ")}`,
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ownership guard — farmer must own the order; admin bypasses
    if (req.user.role === "farmer") {
      if (String(order.farmerId) !== String(req.user.id)) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    // Apply status change
    order.status = status;
    order.statusHistory.push({ status, changedAt: new Date() });

    if (status === "rejected" && farmerNote !== undefined) {
      order.farmerNote = String(farmerNote).trim();
    }

    await order.save();

    // Inventory deduction on delivery
    if (status === "delivered") {
      const current = await Listing.findById(order.listingId).select("quantity").lean();
      if (current) {
        const newQty = Math.max(0, Number(current.quantity) - order.orderedQty);
        await Listing.findByIdAndUpdate(order.listingId, { $set: { quantity: newQty } });
      }
    }

    // Notify the customer
    try {
      await notifyCustomerOrderUpdate({
        customerUserId: order.customerId,
        status,
        produceName: order.produceName,
        orderedQty: order.orderedQty,
        unit: order.unit,
      });
    } catch (_) {
      // Notification failure must not break the status update
    }

    return res.json(order);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update order status" });
  }
}

module.exports = {
  placeOrder,
  getCustomerOrders,
  getCustomerOrderById,
  getFarmerOrders,
  updateOrderStatus,
};
