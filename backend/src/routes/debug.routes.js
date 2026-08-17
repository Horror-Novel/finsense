const express = require("express");
const { getHoistingDemo } = require("../utils/hoisting");
const { createRateLimiter, createDebouncer } = require("../utils/closureDemo");

const router = express.Router();

// GET /api/debug/hoisting
// Returns a live JSON response demonstrating JavaScript hoisting.
// Open this in a browser during a viva: http://localhost:5000/api/debug/hoisting
// The response proves hoisting runs at runtime (not just in comments).
router.get("/hoisting", (req, res) => {
  res.status(200).json({
    success: true,
    data: getHoistingDemo(),
  });
});

// GET /api/debug/closures
// Returns a live JSON response demonstrating JavaScript closures.
router.get("/closures", (req, res) => {
  // Each call to createRateLimiter creates a NEW closure with its own
  // private `calls` array — demonstrating closure instance isolation.
  const limiterA = createRateLimiter(3, 5000);
  const limiterB = createRateLimiter(3, 5000);

  // Call limiterA twice — its internal `calls` array now has 2 entries
  limiterA();
  limiterA();

  // limiterB is a completely separate closure — its `calls` array is still empty
  const isolationDemo = {
    limiterA_callsUsed: 2,
    limiterA_allowed: limiterA(), // 3rd call — still allowed (limit is 3)
    limiterB_allowed: limiterB(), // 1st call on B — allowed (separate closure)
    explanation:
      "limiterA and limiterB each close over their own private `calls` array. " +
      "Using limiterA does not affect limiterB — closure instance isolation.",
  };

  res.status(200).json({
    success: true,
    data: {
      concept: "JavaScript Closures",
      definition:
        "A closure is a function that retains access to its outer scope's variables " +
        "even after the outer function has returned.",
      instanceIsolation: isolationDemo,
      vivaNote:
        "In the frontend, useDebouncer() and useRateLimiter() in lib/useClosures.js " +
        "return closures that remember `timer` and `calls` respectively. " +
        "useRef keeps the same closure instance across React re-renders.",
    },
  });
});

module.exports = router;
