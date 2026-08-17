const rateLimit = require("express-rate-limit");

// Applied specifically to LLM-backed routes (categorize / chat) since
// those are the most expensive calls (cost money + are slow) and the
// most likely target of abuse.
const llmRateLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many AI requests — please slow down and try again shortly.",
  },
});

// A looser general limiter for auth routes to slow down brute-force attempts
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts — please try again later.",
  },
});

module.exports = { llmRateLimiter, authRateLimiter };
