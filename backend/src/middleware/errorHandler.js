const ApiError = require("../utils/apiError");

// 404 handler — runs when no route matched
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error handler — every thrown/forwarded error ends up here.
// Keeping this in one place means every route returns errors in the
// same JSON shape, with the correct HTTP status code.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Prisma unique-constraint violation
  if (err.code === "P2002") {
    statusCode = 409;
    message = `A record with this ${err.meta?.target?.join(", ")} already exists`;
  }

  // Prisma record-not-found
  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired";
  }

  console.error(err);

  if (process.env.NODE_ENV === "production") {
    // In production, mask 500 server errors so we don't leak developer logs/stack traces to the frontend UI
    if (statusCode === 500) {
      message = "Internal server error";
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || undefined,
  });
}

module.exports = { notFound, errorHandler };
