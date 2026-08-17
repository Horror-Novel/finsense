const Redis = require("ioredis");

let redis = null;
let redisAvailable = false;

// Cache is purely a performance optimization, never a source of truth.
// Every helper below fails OPEN (silently skips caching) instead of
// crashing a request if Redis is slow, misconfigured, or not running —
// so the app works identically with or without Redis, just faster with it.
function initRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log("ℹ️  REDIS_URL not set — running without cache (summary endpoint hits Postgres directly)");
    return;
  }

  redis = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true, retryStrategy: () => null });

  redis
    .connect()
    .then(() => {
      redisAvailable = true;
      console.log("✅ Redis connected (caching enabled)");
    })
    .catch((err) => {
      redisAvailable = false;
      console.warn("⚠️  Redis unavailable, continuing without cache:", err.message);
    });

  redis.on("error", () => {
    redisAvailable = false;
  });
}

async function cacheGet(key) {
  if (!redisAvailable) return null;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function cacheSet(key, value, ttlSeconds = 60) {
  if (!redisAvailable) return;
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* ignore — caching is best-effort */
  }
}

async function cacheDel(key) {
  if (!redisAvailable) return;
  try {
    await redis.del(key);
  } catch {
    /* ignore */
  }
}

module.exports = { initRedis, cacheGet, cacheSet, cacheDel };
