// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
// Redis-backed Next.js cache handler for stateless ECS Fargate deployment.
// Reads REDIS_URL env var -- same as BullMQ and rate-limiter connections.
const { Redis } = require("ioredis");

const CACHE_PREFIX = "nextjs:cache:";
const DEFAULT_TTL = 3600; // 1 hour

/** @type {import("ioredis").Redis | null} */
let redis = null;

function getRedis() {
  if (!redis) {
    const url = process.env.REDIS_URL ?? "redis://localhost:6380";
    redis = new Redis(url, {
      maxRetriesPerRequest: null,
      connectTimeout: 5000,
      commandTimeout: 3000,
    });
    redis.on("error", (err) => {
      // Log but don't crash — Next.js falls back to no-cache gracefully
      console.error("[CacheHandler] Redis error:", err.message);
    });
  }
  return redis;
}

module.exports = class CacheHandler {
  constructor() {}

  /**
   * Next.js expects: { value: IncrementalCacheValue, lastModified: number } | null
   * @param {string} key
   */
  async get(key) {
    try {
      const raw = await getRedis().get(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      if (!entry || typeof entry !== "object") return null;
      // Legacy entries stored before the { value, lastModified } wrapper — wrap on read
      // to avoid a thundering herd of cache misses on first deploy
      if (!("value" in entry)) {
        return { value: entry, lastModified: Date.now() };
      }
      return entry;
    } catch {
      return null;
    }
  }

  /**
   * Next.js passes IncrementalCacheValue as `data`. We wrap it with lastModified.
   * @param {string} key
   * @param {unknown} data
   * @param {{ revalidate?: number | false; tags?: string[] }} ctx
   */
  async set(key, data, ctx) {
    const ttl =
      typeof ctx?.revalidate === "number" ? ctx.revalidate : DEFAULT_TTL;
    try {
      // Wrap in { value, lastModified } so get() returns the shape Next.js expects
      const entry = { value: data, lastModified: Date.now() };
      const serialized = JSON.stringify(entry);
      if (ttl > 0) {
        await getRedis().setex(`${CACHE_PREFIX}${key}`, ttl, serialized);
      } else {
        await getRedis().set(`${CACHE_PREFIX}${key}`, serialized);
      }

      // Store tag -> key mapping for tag-based revalidation
      if (ctx?.tags?.length) {
        const pipeline = getRedis().pipeline();
        for (const tag of ctx.tags) {
          pipeline.sadd(`${CACHE_PREFIX}tag:${tag}`, key);
        }
        await pipeline.exec();
      }
    } catch {
      // Fail silently — cache miss is acceptable
    }
  }

  /**
   * @param {string | string[]} tag
   */
  async revalidateTag(tag) {
    const tags = Array.isArray(tag) ? tag : [tag];
    try {
      for (const t of tags) {
        const keys = await getRedis().smembers(`${CACHE_PREFIX}tag:${t}`);
        if (keys.length > 0) {
          const pipeline = getRedis().pipeline();
          for (const key of keys) {
            pipeline.del(`${CACHE_PREFIX}${key}`);
          }
          pipeline.del(`${CACHE_PREFIX}tag:${t}`);
          await pipeline.exec();
        }
      }
    } catch {
      // Fail silently
    }
  }
};
