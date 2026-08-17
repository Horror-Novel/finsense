const express = require("express");
const { runAnalysis } = require("../controllers/agent.controller");
const { requireAuth } = require("../middleware/auth");
const { llmRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.use(requireAuth);

// Rate-limited like other LLM-backed routes — a multi-step agent run can
// make several Gemini calls in one request, so it's the most expensive
// single endpoint in the app.
router.post("/analyze", llmRateLimiter, runAnalysis);

module.exports = router;
