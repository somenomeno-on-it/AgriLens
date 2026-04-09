const jwt = require("jsonwebtoken");
const Agent = require("../models/Agent");

function getJwtSecret() {
  return process.env.JWT_SECRET || "change-this-jwt-secret";
}

function extractToken(req) {
  const authHeader = req.header("authorization") || req.header("Authorization");
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return null;
  return token.trim();
}

async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const userId = payload?.sub ? String(payload.sub) : "";
  const role = payload?.role ? String(payload.role).toLowerCase() : "";
  if (!userId || !["farmer", "agent", "admin"].includes(role)) {
    return res.status(401).json({ message: "Invalid token payload" });
  }

  let assignedRegions = [];
  if (role === "agent") {
    const agent = await Agent.findOne({ userId }).select("assignedRegions").lean();
    assignedRegions = Array.isArray(agent?.assignedRegions)
      ? agent.assignedRegions
          .map((region) => String(region?.upazila || "").trim().toLowerCase())
          .filter(Boolean)
      : [];
  }

  req.user = {
    id: userId,
    role,
    assignedRegions,
  };
  return next();
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

