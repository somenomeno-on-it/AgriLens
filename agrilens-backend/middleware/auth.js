// Temporary auth middleware for development.
// In a real app, replace this with proper JWT/session auth.

function requireAuth(req, res, next) {
  const userId = req.header("x-user-id");
  const roleHeader = req.header("x-user-role");
  const assignedRegionsHeader = req.header("x-assigned-regions");

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Missing x-user-id header (temporary auth placeholder)" });
  }

  let assignedRegions = [];
  if (assignedRegionsHeader) {
    try {
      const parsed = JSON.parse(assignedRegionsHeader);
      if (Array.isArray(parsed)) {
        assignedRegions = parsed
          .map((region) => String(region).trim().toLowerCase())
          .filter(Boolean);
      } else {
        assignedRegions = String(assignedRegionsHeader)
          .split(",")
          .map((region) => region.trim().toLowerCase())
          .filter(Boolean);
      }
    } catch (err) {
      assignedRegions = String(assignedRegionsHeader)
        .split(",")
        .map((region) => region.trim().toLowerCase())
        .filter(Boolean);
    }
  }

  req.user = {
    id: userId,
    role: roleHeader ? String(roleHeader).toLowerCase() : "farmer",
    assignedRegions,
  };
  next();
}

function requireFarmer(req, res, next) {
  if (!req.user || req.user.role !== "farmer") {
    return res.status(403).json({ message: "Farmer role required" });
  }
  next();
}

function requireAgent(req, res, next) {
  if (!req.user || req.user.role !== "agent") {
    return res.status(403).json({ message: "Agent role required" });
  }
  next();
}

module.exports = {
  requireAuth,
  requireFarmer,
  requireAgent,
};

