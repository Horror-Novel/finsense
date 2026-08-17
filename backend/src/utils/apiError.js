// Custom error class so controllers can throw meaningful, typed errors
// (e.g. `throw new ApiError(404, "Transaction not found")`) that the
// centralized error handler middleware knows how to translate into a
// proper HTTP response.
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
