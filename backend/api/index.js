// Vercel serverless entry point. vercel.json rewrites every request to this
// function; Express then routes it exactly as it does under src/server.js.
// Socket.io and node-cron are not started here: Vercel functions can't hold
// WebSocket connections, and the daily digest runs via Vercel Cron instead
// (see the "crons" block in vercel.json and /api/cron/daily-digest).
const app = require("../src/app");
const connectMongo = require("../src/config/db");
const { initRedis } = require("../src/config/redis");

initRedis();

module.exports = async (req, res) => {
  // Health check answers without touching any database, so it's a quick
  // way to confirm the deployment itself is live.
  if (req.url.startsWith("/api/health")) return app(req, res);

  try {
    await connectMongo();
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: "Database unavailable" }));
    return;
  }
  return app(req, res);
};
