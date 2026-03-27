const Agent = require("../models/Agent");

function normalizeRegionValue(value) {
  return String(value || "").trim().toLowerCase();
}

function parseHeaderRegions(rawHeader) {
  if (!rawHeader) return [];

  try {
    const parsed = JSON.parse(rawHeader);
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => normalizeRegionValue(entry))
        .filter(Boolean)
        .map((upazila) => ({ district: "", upazila }));
    }
  } catch (err) {
    // Fallback to CSV parsing.
  }

  return String(rawHeader)
    .split(",")
    .map((entry) => normalizeRegionValue(entry))
    .filter(Boolean)
    .map((upazila) => ({ district: "", upazila }));
}

async function regionScope(req, res, next) {
  try {
    const routeAgentId = String(req.params.id || "").trim();
    const requesterId = String(req.user?.id || "").trim();

    if (!routeAgentId || !requesterId || routeAgentId !== requesterId) {
      return res.status(403).json({ message: "Agent id mismatch" });
    }

    const headerAssignedRegions = parseHeaderRegions(req.header("x-assigned-regions"));

    const agent = await Agent.findOne({ userId: requesterId }).select(
      "assignedRegions"
    );
    const dbAssignedRegions = Array.isArray(agent?.assignedRegions)
      ? agent.assignedRegions
          .map((region) => ({
            district: normalizeRegionValue(region?.district),
            upazila: normalizeRegionValue(region?.upazila),
          }))
          .filter((region) => region.upazila)
      : [];

    const effectiveRegions = dbAssignedRegions.length
      ? dbAssignedRegions
      : headerAssignedRegions;
    const upazilas = [...new Set(effectiveRegions.map((r) => r.upazila))];

    req.regionScope = {
      assignedRegions: effectiveRegions,
      upazilas,
    };
    req.query.upazilas = upazilas.join(",");
    return next();
  } catch (err) {
    return res.status(500).json({ message: "Failed to build region scope" });
  }
}

module.exports = {
  regionScope,
};
