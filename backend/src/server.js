require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectMongo = require("./config/db");
const prisma = require("./config/prisma");
const { initRedis } = require("./config/redis");
const { initSocket } = require("./services/socket.service");
const { startCronJobs } = require("./services/cron.service");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Sanity-check the Postgres connection (via Prisma) before serving traffic
    await prisma.$connect();
    console.log("✅ Postgres connected (via Prisma)");

    await connectMongo();

    // Redis is optional — initRedis() logs a warning and continues without
    // caching if REDIS_URL isn't set or the server isn't reachable.
    initRedis();

    // We create a plain Node http.Server ourselves (instead of calling
    // app.listen directly) because Socket.io needs to attach to the same
    // underlying HTTP server as Express, so WebSocket upgrade requests and
    // normal REST requests can share one port.
    const httpServer = http.createServer(app);
    initSocket(httpServer);

    // Scheduled jobs (daily spending digest) start once the server is up
    startCronJobs();

    httpServer.listen(PORT, () => {
      console.log(`🚀 FinSense API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
