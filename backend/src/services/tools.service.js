const prisma = require("../config/prisma");
const { cacheDel } = require("../config/redis");
const { emitToUser } = require("./socket.service");

// ---------------------------------------------------------------------
// This file is the "tool belt" the LLM can use via Gemini function
// calling. Each tool has two halves:
//   1. A declaration (name, description, parameter schema) — this is
//      what we hand to Gemini so it knows what tools exist and when to
//      use them. The description is doing prompt-engineering work: it's
//      the model's only guide for *when* to call this vs. not.
//   2. An executor — the real JS function that actually runs when the
//      model asks to call that tool.
// The same tool set powers both the regular chat assistant (single tool
// call per turn) and the multi-step Budget Agent (several tool calls
// chained in a loop) — see llm.service.js and agent.service.js.
// ---------------------------------------------------------------------

async function getSpendingSummary({ userId, month }) {
  const where = { userId };
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.spentAt = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where,
    _sum: { amount: true },
    _count: true,
  });

  const categories = await prisma.category.findMany({ where: { userId } });
  const map = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return grouped.map((g) => ({
    category: map[g.categoryId] || "Uncategorized",
    total: Number(g._sum.amount || 0),
    count: g._count,
  }));
}

async function getCategoryComparison({ userId }) {
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const [thisMonthData, lastMonthData] = await Promise.all([
    getSpendingSummary({ userId, month: thisMonth }),
    getSpendingSummary({ userId, month: lastMonth }),
  ]);

  const lastMap = Object.fromEntries(lastMonthData.map((c) => [c.category, c.total]));

  return thisMonthData.map((c) => ({
    category: c.category,
    thisMonth: c.total,
    lastMonth: lastMap[c.category] || 0,
    changePercent: lastMap[c.category]
      ? Math.round(((c.total - lastMap[c.category]) / lastMap[c.category]) * 100)
      : null,
  }));
}

async function getRecentTransactions({ userId, limit = 10, categoryName }) {
  const where = { userId };

  if (categoryName) {
    const category = await prisma.category.findFirst({
      where: { userId, name: { equals: categoryName, mode: "insensitive" } },
    });
    if (category) where.categoryId = category.id;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { spentAt: "desc" },
    take: Math.min(Number(limit) || 10, 50),
    include: { category: true },
  });

  return transactions.map((t) => ({
    description: t.description,
    amount: Number(t.amount),
    category: t.category?.name || "Uncategorized",
    date: t.spentAt.toISOString().slice(0, 10),
  }));
}

// The only *write* tool — used when a user explicitly asks the chat
// assistant to log an expense conversationally (e.g. "add 200 for coffee").
// After creating it, we invalidate the cached summary and broadcast a
// WebSocket event so every other open tab for this user updates live —
// tying the function-calling, caching, and real-time features together.
async function createTransactionTool({ userId, description, amount, categoryName }) {
  let category = null;
  if (categoryName) {
    category = await prisma.category.findFirst({
      where: { userId, name: { equals: categoryName, mode: "insensitive" } },
    });
    if (!category) {
      category = await prisma.category.create({ data: { userId, name: categoryName } });
    }
  }

  const tx = await prisma.transaction.create({
    data: {
      userId,
      description,
      amount,
      categoryId: category?.id || null,
      source: "AI_CATEGORIZED",
    },
    include: { category: true },
  });

  await cacheDel(`summary:${userId}`);
  emitToUser(userId, "transaction:created", tx);

  return {
    id: tx.id,
    description: tx.description,
    amount: Number(tx.amount),
    category: tx.category?.name || "Uncategorized",
  };
}

// ---------------------------------------------------------------------
// Gemini function declarations — the "menu" shown to the model. Uses
// Gemini's schema format (uppercase type names).
// ---------------------------------------------------------------------
const TOOL_DECLARATIONS = {
  get_spending_summary: {
    name: "get_spending_summary",
    description:
      "Get the user's total spending grouped by category, optionally filtered to one month (format YYYY-MM). Use this to answer questions about totals or category breakdowns.",
    parameters: {
      type: "OBJECT",
      properties: {
        month: { type: "STRING", description: "Optional month filter, format YYYY-MM" },
      },
    },
  },
  get_category_comparison: {
    name: "get_category_comparison",
    description:
      "Compare this month's spending per category against last month's, including percent change. Use this for questions about spending trends, increases, or decreases.",
    parameters: { type: "OBJECT", properties: {} },
  },
  get_recent_transactions: {
    name: "get_recent_transactions",
    description:
      "Get the user's most recent individual transactions, optionally filtered by category name. Use this when the user asks about specific recent purchases.",
    parameters: {
      type: "OBJECT",
      properties: {
        limit: { type: "NUMBER", description: "How many transactions to return, max 50" },
        categoryName: { type: "STRING", description: "Optional category name to filter by" },
      },
    },
  },
  create_transaction: {
    name: "create_transaction",
    description:
      "Log a new expense on the user's behalf when they explicitly ask you to add, log, or record an expense in the chat (e.g. 'add 200 for coffee'). Do NOT call this unless the user clearly asked you to record something new.",
    parameters: {
      type: "OBJECT",
      properties: {
        description: { type: "STRING", description: "Short description of the expense" },
        amount: { type: "NUMBER", description: "Amount spent" },
        categoryName: { type: "STRING", description: "Category name — reuse an existing one if it fits" },
      },
      required: ["description", "amount"],
    },
  },
};

const TOOL_EXECUTORS = {
  get_spending_summary: getSpendingSummary,
  get_category_comparison: getCategoryComparison,
  get_recent_transactions: getRecentTransactions,
  create_transaction: createTransactionTool,
};

// Runs a single named tool with the model's requested arguments. Critically,
// the real authenticated `userId` is always injected by US, server-side —
// never taken from the model's arguments — so the model can never be
// tricked (via prompt injection or otherwise) into reading or writing
// another user's data.
async function executeTool(name, args, userId) {
  const fn = TOOL_EXECUTORS[name];
  if (!fn) throw new Error(`Unknown tool requested: ${name}`);
  return fn({ ...args, userId });
}

function getDeclarations(names) {
  return names.map((n) => TOOL_DECLARATIONS[n]).filter(Boolean);
}

module.exports = { getDeclarations, executeTool };
