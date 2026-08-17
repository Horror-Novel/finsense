const prisma = require("../config/prisma");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/admin/stats
// Returns platform-wide statistics — total users, transactions, revenue, etc.
// Protected by requireRole("ADMIN") — a regular USER hitting this route gets
// a 403 Forbidden response before this controller is even reached.
// This is the deliberate, concrete application of role-based authorization.
const getStats = asyncHandler(async (req, res) => {
  const [userCount, txCount, proCount, totalRevenue] = await Promise.all([
    prisma.user.count(),
    prisma.transaction.count(),
    prisma.user.count({ where: { plan: "PRO" } }),
    prisma.subscription.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, email: true, plan: true, createdAt: true },
  });

  res.status(200).json({
    success: true,
    data: {
      users: { total: userCount, pro: proCount, free: userCount - proCount },
      transactions: { total: txCount },
      revenue: { totalPaise: Number(totalRevenue._sum.amount || 0) },
      recentUsers,
    },
  });
});

// PATCH /api/admin/users/:id/role
// Promotes or demotes a user's role (USER <-> ADMIN).
// Also protected by requireRole("ADMIN").
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["USER", "ADMIN"].includes(role)) {
    return res.status(400).json({ success: false, message: "role must be USER or ADMIN" });
  }

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  res.status(200).json({ success: true, data: user });
});

module.exports = { getStats, updateUserRole };
