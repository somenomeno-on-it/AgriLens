// Temporary auth middleware for development.
// In a real app, replace this with proper JWT/session auth.

function requireAuth(req, res, next) {
  const userId = req.header("x-user-id");

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Missing x-user-id header (temporary auth placeholder)" });
  }

  req.user = { id: userId, role: "farmer" };
  next();
}

function requireFarmer(req, res, next) {
  if (!req.user || req.user.role !== "farmer") {
    return res.status(403).json({ message: "Farmer role required" });
  }
  next();
}

module.exports = {
  requireAuth,
  requireFarmer,
};

