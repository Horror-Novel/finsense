const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");

// Verifies the JWT sent in the Authorization header ("Bearer <token>")
// and attaches the decoded payload to req.user for downstream handlers.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Missing or malformed Authorization header"));
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    next(err); // handled by errorHandler (JsonWebTokenError / TokenExpiredError)
  }
}

// Role-based authorization — usage: requireRole("ADMIN")
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, "Not authenticated"));
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
