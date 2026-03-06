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
      lazyConnect: true,
      enableOfflineQueue: false,
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

/**
 * @typedef {{ kind: string; data: unknown; lastModified: number; tags?: string[] }} CacheEntry
 */

module.exports = class CacheHandler {
  constructor() {}

  /**
   * @param {string} key
   * @returns {Promise<CacheEntry | null>}
   */
  async get(key) {
    try {
      const raw = await getRedis().get(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * @param {string} key
   * @param {CacheEntry} data
   * @param {{ revalidate?: number | false; tags?: string[] }} ctx
   */
  async set(key, data, ctx) {
    const ttl =
      typeof ctx?.revalidate === "number" ? ctx.revalidate : DEFAULT_TTL;
    try {
      const serialized = JSON.stringify(data);
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
   * @param {string} tag
   */
  async revalidateTag(tag) {
    try {
      const keys = await getRedis().smembers(`${CACHE_PREFIX}tag:${tag}`);
      if (keys.length > 0) {
        const pipeline = getRedis().pipeline();
        for (const key of keys) {
          pipeline.del(`${CACHE_PREFIX}${key}`);
        }
        pipeline.del(`${CACHE_PREFIX}tag:${tag}`);
        await pipeline.exec();
      }
    } catch {
      // Fail silently
    }
  }
};
