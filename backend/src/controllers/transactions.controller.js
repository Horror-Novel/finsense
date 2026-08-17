const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { categorizeExpense } = require("../services/llm.service");
const { cacheGet, cacheSet, cacheDel } = require("../config/redis");
const { emitToUser } = require("../services/socket.service");
const { indexTransaction, deleteEmbedding } = require("../services/rag.service");

// GET /api/transactions?month=2026-08&categoryId=3&sort=amount&order=desc&groupBy=category
// Demonstrates filtering, ordering, and grouping (SQL JOINs happen via `include`)
const getTransactions = asyncHandler(async (req, res) => {
  const { month, categoryId, sort = "spentAt", order = "desc", groupBy } = req.query;

  const where = { userId: req.user.id };

  if (month) {
    // month format: "YYYY-MM"
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    where.spentAt = { gte: start, lt: end };
  }

  if (categoryId) {
    where.categoryId = Number(categoryId);
  }

  const allowedSort = ["spentAt", "amount", "createdAt"];
  const orderBy = { [allowedSort.includes(sort) ? sort : "spentAt"]: order === "asc" ? "asc" : "desc" };

  // include = Prisma's way of doing a JOIN against categories
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy,
    include: { category: true },
  });

  if (groupBy === "category") {
    const grouped = {};
    for (const t of transactions) {
      const key = t.category?.name || "Uncategorized";
      if (!grouped[key]) grouped[key] = { total: 0, count: 0, transactions: [] };
      grouped[key].total += Number(t.amount);
      grouped[key].count += 1;
      grouped[key].transactions.push(t);
    }
    return res.status(200).json({ success: true, grouped: true, data: grouped });
  }

  res.status(200).json({ success: true, data: transactions });
});

// GET /api/transactions/summary — totals per category, used for dashboard charts
// and as context fed to the AI chat assistant.
// REDIS CACHING: this is the most frequently-hit read (loaded on every
// Dashboard visit) and its underlying data changes relatively rarely
// compared to how often it's read, making it a good caching candidate.
// Cached for 60s per user; the cache is explicitly invalidated the moment
// a transaction is created/updated/deleted (see below) so users never see
// stale totals for longer than necessary.
const getSummary = asyncHandler(async (req, res) => {
  const cacheKey = `summary:${req.user.id}`;

  const cached = await cacheGet(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, data: cached, cached: true });
  }

  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId: req.user.id },
    _sum: { amount: true },
    _count: true,
  });

  const categories = await prisma.category.findMany({ where: { userId: req.user.id } });
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const summary = grouped.map((g) => ({
    category: categoryMap[g.categoryId] || "Uncategorized",
    total: Number(g._sum.amount || 0),
    count: g._count,
  }));

  await cacheSet(cacheKey, summary, 60);

  res.status(200).json({ success: true, data: summary, cached: false });
});

// POST /api/transactions
// If autoCategrize=true, calls the LLM to classify the expense (structured JSON output)
const createTransaction = asyncHandler(async (req, res) => {
  const { description, amount, merchant, categoryId, spentAt, autoCategrize } = req.body;

  let finalCategoryId = categoryId || null;
  let finalMerchant = merchant || null;
  let aiConfidence = null;
  let source = "MANUAL";

  if (autoCategrize) {
    const existingCategories = await prisma.category.findMany({ where: { userId: req.user.id } });
    const aiResult = await categorizeExpense({
      description,
      existingCategories,
      userId: req.user.id,
    });

    // Find or create the category the AI suggested
    let category = existingCategories.find(
      (c) => c.name.toLowerCase() === String(aiResult.category).toLowerCase()
    );
    if (!category) {
      category = await prisma.category.create({
        data: { name: aiResult.category, userId: req.user.id },
      });
    }
    finalCategoryId = category.id;
    finalMerchant = finalMerchant || aiResult.merchant || null;
    aiConfidence = aiResult.confidence ?? null;
    source = "AI_CATEGORIZED";
  }

  // DB TRANSACTION: creating the expense record must be atomic —
  // we wrap it so that if anything after the create fails, nothing
  // is left in a half-written state. Here it's a single write, but
  // this is the pattern used whenever multiple related writes must
  // succeed or fail together (see README for the fuller example).
  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        description,
        amount,
        merchant: finalMerchant,
        categoryId: finalCategoryId,
        aiConfidence,
        source,
        spentAt: spentAt ? new Date(spentAt) : new Date(),
        userId: req.user.id,
        receiptUrl: req.uploadedReceiptUrl || null,
      },
      include: { category: true },
    });
    return created;
  });

  // Cache invalidation — the summary we cached is now stale
  await cacheDel(`summary:${req.user.id}`);

  // RAG INDEXING: fire-and-forget — generates a text embedding for this
  // transaction and stores it in MongoDB. Never awaited, so the user sees
  // their new transaction immediately rather than waiting for the embedding.
  indexTransaction(transaction).catch(() => {});

  // WEBSOCKET: broadcast to any other open tab/device for this same user
  emitToUser(req.user.id, "transaction:created", transaction);

  res.status(201).json({ success: true, data: transaction });
});

// PATCH /api/transactions/:id
const updateTransaction = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing || existing.userId !== req.user.id) {
    throw new ApiError(404, "Transaction not found");
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: req.body,
    include: { category: true },
  });

  await cacheDel(`summary:${req.user.id}`);
  emitToUser(req.user.id, "transaction:updated", updated);

  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/transactions/:id
const deleteTransaction = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing || existing.userId !== req.user.id) {
    throw new ApiError(404, "Transaction not found");
  }

  await prisma.transaction.delete({ where: { id } });

  await cacheDel(`summary:${req.user.id}`);
  emitToUser(req.user.id, "transaction:deleted", { id });
  deleteEmbedding(req.user.id, id).catch(() => {});

  res.status(200).json({ success: true, message: "Transaction deleted" });
});

module.exports = {
  getTransactions,
  getSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
