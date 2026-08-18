// Wraps an async route handler so any thrown error / rejected promise
// is automatically forwarded to Express's error-handling middleware
// instead of crashing the process or requiring a try/catch in every route.
const asyncHandler = (fn) => (req, res, next) => {
  try {
    Promise.resolve(fn(req, res, next)).catch(next);
  } catch (err) {
    next(err);
  }
};

module.exports = asyncHandler;
