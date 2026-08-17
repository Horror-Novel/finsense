const express = require("express");
const {
  getHistory,
  getChatStats,
  postChat,
  getUsage,
  updateMessage,
  deleteMessage,
  clearHistory,
} = require("../controllers/chat.controller");
const { requireAuth } = require("../middleware/auth");
const { llmRateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.use(requireAuth);

router.get("/history", getHistory);
router.get("/stats", getChatStats); // Mongo aggregation pipeline
router.get("/usage", getUsage);
router.post("/", llmRateLimiter, postChat);

// Full Mongo CRUD on chat messages: Create (postChat above), Read (getHistory
// above), Update (star/unstar), Delete (single message or clear all)
router.patch("/history/:id", updateMessage);
router.delete("/history/:id", deleteMessage);
router.delete("/history", clearHistory);

module.exports = router;
