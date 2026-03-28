/**
 * mockAuth middleware
 *
 * Lightweight, non-blocking header-based auth for the mock authentication system.
 * Reads x-user-id and x-user-role from request headers and populates req.user.
 *
 * Key differences from requireAuth (middleware/auth.js):
 *   - Does NOT block / return 401 if headers are missing
 *   - Always calls next() — security is enforced downstream by role-check middleware
 *   - req.user is set to null if required headers are absent
 *
 * Chain example:
 *   mockAuth → requireAdmin → controller
 */
function mockAuth(req, res, next) {
  const userId = req.header("x-user-id");
  const roleHeader = req.header("x-user-role");
  const assignedRegionsHeader = req.header("x-assigned-regions");

  if (!userId && !roleHeader) {
    // No auth headers at all — leave req.user as undefined so downstream guards deny
    req.user = null;
    return next();
  }

  // Parse assigned regions the same way existing requireAuth does
  let assignedRegions = [];
  if (assignedRegionsHeader) {
    try {
      const parsed = JSON.parse(assignedRegionsHeader);
      if (Array.isArray(parsed)) {
        assignedRegions = parsed
          .map((r) => String(r).trim().toLowerCase())
          .filter(Boolean);
      } else {
        assignedRegions = String(assignedRegionsHeader)
          .split(",")
          .map((r) => r.trim().toLowerCase())
          .filter(Boolean);
      }
    } catch {
      assignedRegions = String(assignedRegionsHeader)
        .split(",")
        .map((r) => r.trim().toLowerCase())
        .filter(Boolean);
    }
  }

  req.user = {
    id: userId || null,
    role: roleHeader ? String(roleHeader).trim().toLowerCase() : null,
    assignedRegions,
  };

  next();
}

module.exports = mockAuth;
