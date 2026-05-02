const Customer = require("../models/Customer");

/**
 * GET /api/customer/profile
 * Returns the authenticated customer's profile (password excluded by model design).
 */
async function getCustomerProfile(req, res) {
  try {
    const customer = await Customer.findOne({ userId: req.user.id });
    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }
    return res.json(customer);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch customer profile" });
  }
}

/**
 * PUT /api/customer/profile
 * Updates name, phone, and address for the authenticated customer.
 * Does not allow role or email changes.
 */
async function updateCustomerProfile(req, res) {
  const { name, phone, address } = req.body;

  try {
    let customer = await Customer.findOne({ userId: req.user.id });

    if (!customer) {
      return res.status(404).json({ message: "Customer profile not found" });
    }

    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) {
      customer.address = {
        division: address.division || customer.address.division || "",
        district: address.district || customer.address.district || "",
        upazila: address.upazila || customer.address.upazila || "",
        details: address.details || customer.address.details || "",
      };
    }

    await customer.save();
    return res.json(customer);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update customer profile" });
  }
}

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
};
