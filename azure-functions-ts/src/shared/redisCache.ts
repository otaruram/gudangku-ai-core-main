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
