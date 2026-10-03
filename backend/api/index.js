// Vercel serverless entry point. vercel.json rewrites every request to this
// function; Express then routes it exactly as it does under src/server.js.
// Socket.io and node-cron are not started here: Vercel functions can't hold
// WebSocket connections, and the daily digest runs via Vercel Cron instead
// (see the "crons" block in vercel.json and /api/cron/daily-digest).
const app = require("../src/app");
const connectMongo = require("../src/config/db");
const { initRedis } = require("../src/config/redis");

initRedis();

module.exports = (req, res) => {
  // Start (or reuse) the MongoDB connection without waiting for it.
  // Mongoose queues queries until it's connected, so Postgres-only requests
  // (most of the app) don't pay MongoDB's connection time on a cold start.
  if (!req.url.startsWith("/api/health")) {
    connectMongo().catch((err) => console.error("❌ MongoDB connection failed:", err.message));
  }
  return app(req, res);
};
