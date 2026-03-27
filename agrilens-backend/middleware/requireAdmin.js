/**
 * requireAdmin middleware
 * Must be used AFTER requireAuth so that req.user is already populated.
 * Uses the same error response format as requireFarmer / requireAgent in auth.js
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin role required" });
  }
  next();
}

module.exports = requireAdmin;
