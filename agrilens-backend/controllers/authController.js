const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const AuthUser = require("../models/AuthUser");
const FarmerProfile = require("../models/FarmerProfile");
const Agent = require("../models/Agent");
const Admin = require("../models/Admin");
const Customer = require("../models/Customer");

function getJwtSecret() {
  return process.env.JWT_SECRET || "change-this-jwt-secret";
}

function signAuthToken(userId, role) {
  return jwt.sign({ sub: userId, role }, getJwtSecret(), { expiresIn: "7d" });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function pickDisplayName(fullName, email) {
  if (fullName && String(fullName).trim()) return String(fullName).trim();
  return normalizeEmail(email).split("@")[0] || "User";
}

async function createRoleProfile(role, userId, body, email) {
  const name = pickDisplayName(body.fullName, email);
  if (role === "farmer") {
    await FarmerProfile.create({
      userId,
      fullName: name,
      phone: body.phone || "N/A",
      address: body.address || "N/A",
      nationalId: body.nationalId,
      experienceYears:
        typeof body.experienceYears === "number" ? body.experienceYears : 0,
      email,
    });
    return { fullName: name };
  }

  if (role === "agent") {
    const assignedRegions = Array.isArray(body.assignedRegions)
      ? body.assignedRegions
          .map((region) => ({
            district: String(region?.district || "").trim().toLowerCase(),
            upazila: String(region?.upazila || "").trim().toLowerCase(),
          }))
          .filter((region) => region.district && region.upazila)
      : [];
    await Agent.create({
      userId,
      fullName: name,
      email,
      assignedRegions,
    });
    return { fullName: name, assignedRegions: assignedRegions.map((r) => r.upazila) };
  }

  if (role === "customer") {
    await Customer.create({
      userId,
      name: name,
      email,
      phone: body.phone || "",
    });
    return { fullName: name };
  }

  await Admin.create({
    userId,
    fullName: name,
    email,
  });
  return { fullName: name };
}

async function getRoleDetails(role, userId) {
  if (role === "farmer") {
    const profile = await FarmerProfile.findOne({ userId })
      .select("fullName isSuspended email")
      .lean();
    return {
      fullName: profile?.fullName || "",
      isSuspended: !!profile?.isSuspended,
      email: profile?.email || "",
      assignedRegions: [],
    };
  }
  if (role === "agent") {
    const agent = await Agent.findOne({ userId })
      .select("fullName isSuspended email assignedRegions")
      .lean();
    return {
      fullName: agent?.fullName || "",
      isSuspended: !!agent?.isSuspended,
      email: agent?.email || "",
      assignedRegions: Array.isArray(agent?.assignedRegions)
        ? agent.assignedRegions
            .map((r) => String(r?.upazila || "").trim().toLowerCase())
            .filter(Boolean)
        : [],
    };
  }
  if (role === "customer") {
    const customer = await Customer.findOne({ userId })
      .select("name isSuspended email")
      .lean();
    return {
      fullName: customer?.name || "",
      isSuspended: !!customer?.isSuspended,
      email: customer?.email || "",
      assignedRegions: [],
    };
  }

  const admin = await Admin.findOne({ userId }).select("fullName email").lean();
  return {
    fullName: admin?.fullName || "",
    isSuspended: false,
    email: admin?.email || "",
    assignedRegions: [],
  };
}

async function signup(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const role = req.body.role ? String(req.body.role).toLowerCase() : "farmer";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!["farmer", "agent", "customer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    if (role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot be created via signup" });
    }

    const existing = await AuthUser.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    await AuthUser.create({
      userId,
      email,
      passwordHash,
      role,
    });

    const roleProfile = await createRoleProfile(role, userId, req.body, email);
    const token = signAuthToken(userId, role);

    return res.status(201).json({
      token,
      user: {
        id: userId,
        role,
        email,
        fullName: roleProfile.fullName || "",
        assignedRegions: roleProfile.assignedRegions || [],
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create account" });
  }
}

async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const authUser = await AuthUser.findOne({ email });
    if (!authUser) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, authUser.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const roleDetails = await getRoleDetails(authUser.role, authUser.userId);
    if (roleDetails.isSuspended) {
      return res.status(403).json({ message: "Account is suspended" });
    }

    const token = signAuthToken(authUser.userId, authUser.role);
    return res.json({
      token,
      user: {
        id: authUser.userId,
        role: authUser.role,
        email: roleDetails.email || authUser.email,
        fullName: roleDetails.fullName || "",
        assignedRegions: roleDetails.assignedRegions || [],
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to login" });
  }
}

async function me(req, res) {
  return res.json({
    user: {
      id: req.user.id,
      role: req.user.role,
      assignedRegions: req.user.assignedRegions || [],
    },
  });
}

module.exports = {
  signup,
  login,
  me,
};
