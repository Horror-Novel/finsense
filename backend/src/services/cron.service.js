const cron = require("node-cron");
const prisma = require("../config/prisma");
const Digest = require("../models/Digest");

// Generates one digest document for one user, summarizing their spending
// in the last 24 hours. Returns null (and creates nothing) if they had no
// transactions in that window — no point storing an empty digest.
async function generateDigestForUser(user, generatedBy = "cron") {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, spentAt: { gte: since } },
    include: { category: true },
  });

  if (transactions.length === 0) return null;

  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const breakdown = {};
  for (const t of transactions) {
    const cat = t.category?.name || "Uncategorized";
    breakdown[cat] = (breakdown[cat] || 0) + Number(t.amount);
  }
  const topCategory = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return Digest.create({
    userId: user.id,
    periodLabel: new Date().toISOString().slice(0, 10),
    totalSpent,
    topCategory,
    categoryBreakdown: breakdown,
    transactionCount: transactions.length,
    generatedBy,
  });
}

// The actual scheduled job — loops over every user and generates their digest.
async function runDailyDigestJob() {
  console.log("⏰ Running daily digest cron job...");
  const users = await prisma.user.findMany();

  let created = 0;
  for (const user of users) {
    try {
      const digest = await generateDigestForUser(user, "cron");
      if (digest) created++;
    } catch (err) {
      console.error(`  ❌ Digest failed for user ${user.id}:`, err.message);
    }
  }
  console.log(`✅ Daily digest job finished — ${created} digest(s) created`);
}

// Registers the cron job at server startup. Schedule format is
// "minute hour day-of-month month day-of-week" — "0 8 * * *" means every
// day at 08:00 server time. (For a live demo, use the manual
// POST /api/digests/run-now endpoint instead of waiting for 8am!)
function startCronJobs() {
  cron.schedule("0 8 * * *", runDailyDigestJob);
  console.log("🕐 Cron jobs scheduled (daily spending digest at 08:00 server time)");
}

module.exports = { startCronJobs, runDailyDigestJob, generateDigestForUser };
