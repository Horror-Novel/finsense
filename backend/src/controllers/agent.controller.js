const asyncHandler = require("../utils/asyncHandler");
const { runBudgetAgent } = require("../services/agent.service");

// POST /api/agent/analyze — runs the multi-step Budget Health Agent and
// returns its full trace (every tool call + result) plus the final report.
// Returning the trace (not just the final text) is deliberate: it's what
// lets the frontend show "the agent's thinking" step by step, and it's
// what you'd point to in a viva to prove this is a genuine multi-step
// loop and not a single canned function call.
const runAnalysis = asyncHandler(async (req, res) => {
  const { trace, report } = await runBudgetAgent({ userId: req.user.id });
  res.status(200).json({ success: true, trace, report });
});

module.exports = { runAnalysis };
