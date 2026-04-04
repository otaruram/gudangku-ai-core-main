/**
 * Azure Cache for Redis — AI response caching layer.
 * TTL: 3–6 hours (configurable). Saves Gemini API token costs.
 */
import Redis from "ioredis";
import { createHash } from "crypto";

let _redis: Redis | null = null;

const DEFAULT_TTL_SECONDS = 4 * 60 * 60; // 4 hours

function getRedis(): Redis {
  if (!_redis) {
    const connStr = process.env.REDIS_CONNECTION_STRING!;
    // Azure Redis format: <host>:6380,password=<key>,ssl=True,abortConnect=False
    // ioredis expects: rediss://:password@host:6380
    if (connStr.startsWith("rediss://") || connStr.startsWith("redis://")) {
      _redis = new Redis(connStr);
    } else {
      // Parse Azure-style connection string
      const parts = Object.fromEntries(
        connStr.split(",").map((p) => {
          const [k, ...v] = p.split("=");
          return [k.trim().toLowerCase(), v.join("=").trim()];
        })
      );
      const host = parts[""] || connStr.split(":")[0].split(",")[0];
      const port = parseInt(connStr.split(":")[1]?.split(",")[0] || "6380");
      const password = parts["password"];
      _redis = new Redis({
        host,
        port,
        password,
        tls: { servername: host },
      });
    }
  }
  return _redis;
}

/**
 * Generate a deterministic cache key from the user query.
 */
function buildCacheKey(query: string): string {
  const normalized = query.trim().toLowerCase();
  const hash = createHash("sha256").update(normalized).digest("hex");
  return `gemini:${hash}`;
}

/**
 * Try to get a cached AI response for the given query.
 */
export async function getCachedResponse(
  query: string
): Promise<string | null> {
  try {
    const key = buildCacheKey(query);
    const cached = await getRedis().get(key);
    return cached;
  } catch (err) {
    console.warn("Redis GET failed, skipping cache:", err);
    return null;
  }
}

/**
 * Cache an AI response with TTL.
 */
export async function setCachedResponse(
  query: string,
  response: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
  try {
    const key = buildCacheKey(query);
    await getRedis().setex(key, ttlSeconds, response);
  } catch (err) {
    console.warn("Redis SET failed, skipping cache:", err);
  }
}

/**
 * Sliding-window rate limiter.
 * Returns { allowed, remaining, retryAfterMs }.
 */
export async function checkRateLimit(
  userId: string,
  windowSeconds: number = 60,
  maxRequests: number = 10
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  try {
    const key = `ratelimit:${userId}`;
    const redis = getRedis();
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Use a sorted set: score = timestamp, value = unique request id
    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, now - windowMs); // prune old entries
    multi.zadd(key, now, `${now}:${Math.random().toString(36).slice(2, 8)}`);
    multi.zcard(key);
    multi.expire(key, windowSeconds + 1);
    const results = await multi.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    if (count > maxRequests) {
      // Find oldest entry in window to compute retry-after
      const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
      const oldestTs = oldest.length >= 2 ? parseInt(oldest[1]) : now;
      const retryAfterMs = Math.max(0, (oldestTs + windowMs) - now);
      return { allowed: false, remaining: 0, retryAfterMs };
    }
    return { allowed: true, remaining: maxRequests - count, retryAfterMs: 0 };
  } catch (err) {
    console.warn("Rate limit check failed, allowing request:", err);
    return { allowed: true, remaining: -1, retryAfterMs: 0 };
  }
}
