const prisma = require("../config/prisma");
const ChatMessage = require("../models/ChatMessage");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { streamBasicChatReply } = require("../services/llm.service");

// GET /api/chat/history
// Chat history lives in MongoDB. (Read)
const getHistory = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({ userId: req.user.id })
    .sort({ createdAt: 1 })
    .limit(100);

  res.status(200).json({ success: true, data: messages });
});

// GET /api/chat/stats
// MongoDB AGGREGATION PIPELINE — groups this user's messages by day and
// computes per-day counts, a starred count, and average message length,
// entirely inside MongoDB (not by pulling everything into Node and
// looping). This is the concrete "aggregation pipeline" feature: a
// multi-stage $match -> $group -> $sort pipeline.
const getChatStats = asyncHandler(async (req, res) => {
  const stats = await ChatMessage.aggregate([
    // Stage 1: only this user's messages
    { $match: { userId: req.user.id } },
    // Stage 2: group by calendar day, computing several aggregates at once
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalMessages: { $sum: 1 },
        userMessages: { $sum: { $cond: [{ $eq: ["$role", "user"] }, 1, 0] } },
        assistantMessages: { $sum: { $cond: [{ $eq: ["$role", "assistant"] }, 1, 0] } },
        starredCount: { $sum: { $cond: ["$starred", 1, 0] } },
        avgLength: { $avg: { $strLenCP: "$content" } },
      },
    },
    // Stage 3: chronological order for charting
    { $sort: { _id: 1 } },
    // Stage 4: tidy up field names for the frontend
    {
      $project: {
        _id: 0,
        date: "$_id",
        totalMessages: 1,
        userMessages: 1,
        assistantMessages: 1,
        starredCount: 1,
        avgLength: { $round: ["$avgLength", 0] },
      },
    },
  ]);

  res.status(200).json({ success: true, data: stats });
});

// POST /api/chat
// Server-Sent Events streaming endpoint, now with Gemini function calling.
// Body: { question: string }
const postChat = asyncHandler(async (req, res) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || !question.trim()) {
    throw new ApiError(400, "`question` is required");
  }

  // Basic input sanitization / prompt-injection awareness.
  const cleanQuestion = question.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").slice(0, 1000);

  // Pull recent transactions as grounding context (used as a fallback if
  // the model doesn't end up calling a tool for this particular question).
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    orderBy: { spentAt: "desc" },
    take: 50,
    include: { category: true },
  });

  const transactionsSummary = recentTransactions.map((t) => ({
    description: t.description,
    amount: Number(t.amount),
    category: t.category?.name || "Uncategorized",
    date: t.spentAt.toISOString().slice(0, 10),
  }));

  // Get recent chat history.
  const history = await ChatMessage.find({ userId: req.user.id }).sort({ createdAt: 1 }).limit(20);

  // Save user's message immediately. (Create)
  await ChatMessage.create({ userId: req.user.id, role: "user", content: cleanQuestion });

  // Set up Server-Sent Events.
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const fullReply = await streamBasicChatReply({
      userId: req.user.id,
      question: cleanQuestion,
      transactionsSummary,
      history,
      onToken: (chunk) => {
        res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
      },
    });

    // Save complete assistant response. (Create)
    const savedReply = await ChatMessage.create({
      userId: req.user.id,
      role: "assistant",
      content: fullReply,
    });

    res.write(`data: ${JSON.stringify({ done: true, id: savedReply._id })}\n\n`);
    res.end();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("GEMINI CHAT ERROR:", err);
      console.error("GEMINI CHAT ERROR MESSAGE:", err?.message || "Unknown error");
    }

    res.write(`data: ${JSON.stringify({ error: "AI request failed. Please try again." })}\n\n`);
    res.end();
  }
});

// GET /api/chat/usage
// Token & cost monitoring.
const getUsage = asyncHandler(async (req, res) => {
  const logs = await prisma.llmUsageLog.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totals = logs.reduce(
    (acc, l) => {
      acc.inputTokens += l.inputTokens;
      acc.outputTokens += l.outputTokens;
      acc.estCostUsd += Number(l.estCostUsd);
      return acc;
    },
    { inputTokens: 0, outputTokens: 0, estCostUsd: 0 }
  );

  res.status(200).json({ success: true, totals, logs });
});

// PATCH /api/chat/history/:id — (Update) star/unstar a message
// Body: { starred: boolean }
const updateMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { starred } = req.body;

  if (typeof starred !== "boolean") {
    throw new ApiError(400, "`starred` must be a boolean");
  }

  const message = await ChatMessage.findOne({ _id: id, userId: req.user.id });
  if (!message) throw new ApiError(404, "Message not found");

  message.starred = starred;
  await message.save();

  res.status(200).json({ success: true, data: message });
});

// DELETE /api/chat/history/:id — (Delete) remove a single message
const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await ChatMessage.findOne({ _id: id, userId: req.user.id });
  if (!message) throw new ApiError(404, "Message not found");

  await message.deleteOne();
  res.status(200).json({ success: true, message: "Message deleted" });
});

// DELETE /api/chat/history — (Delete) clear the entire conversation
const clearHistory = asyncHandler(async (req, res) => {
  await ChatMessage.deleteMany({ userId: req.user.id });
  res.status(200).json({ success: true, message: "Chat history cleared" });
});

module.exports = {
  getHistory,
  getChatStats,
  postChat,
  getUsage,
  updateMessage,
  deleteMessage,
  clearHistory,
};
