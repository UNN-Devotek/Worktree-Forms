import rateLimit, { ipKeyGenerator, Options, RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Rate limiting configuration.
 * Uses Redis store when REDIS_URL is set (production / multi-instance),
 * falls back to in-memory store for local development.
 *
 * IMPORTANT: express-rate-limit forbids sharing a single Store instance across
 * multiple rateLimit() calls. We share the Redis *client* but create a new
 * RedisStore instance per limiter (with a unique prefix) to satisfy this rule.
 */

type RedisClientLike = { sendCommand: (args: string[]) => Promise<boolean | number | string> };

// Shared Redis client singleton — connected once, reused by all stores
let redisClientPromise: Promise<RedisClientLike | undefined> | undefined;

function getRedisClient(): Promise<RedisClientLike | undefined> {
  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      if (!process.env.REDIS_URL) return undefined;
      try {
        const { createClient } = await import('redis');
        const client = createClient({ url: process.env.REDIS_URL });
        client.on('error', (err: Error) => console.error('Redis rate-limit client error:', err.message));
        await client.connect();
        return client as unknown as RedisClientLike;
      } catch (err) {
        console.warn('Rate limiter: failed to connect to Redis, falling back to in-memory store:', err instanceof Error ? err.message : err);
        return undefined;
      }
    })();
  }
  return redisClientPromise;
}

/**
 * Creates a lazy-initialised rate limiter. Each call gets its own RedisStore
 * instance (with a unique prefix) so express-rate-limit does not throw
 * ERR_ERL_STORE_REUSE. The underlying Redis client connection is shared.
 */
let _limiterCounter = 0;
function makeRateLimiter(opts: Partial<Options>): RateLimitRequestHandler {
  const prefix = `rl:${++_limiterCounter}:`;

  const limiterPromise: Promise<RateLimitRequestHandler> = getRedisClient().then(async (client) => {
    if (client) {
      const { RedisStore } = await import('rate-limit-redis');
      const store = new RedisStore({
        prefix,
        sendCommand: (...args: string[]) => client.sendCommand(args),
      });
      return rateLimit({ ...opts, store });
    }
    return rateLimit({ ...opts });
  });

  const middleware = async (req: Request, res: Response, next: NextFunction) => {
    const limiter = await limiterPromise;
    return limiter(req, res, next);
  };

  return middleware as unknown as RateLimitRequestHandler;
}

/**
 * Public rate limiter — 100 requests per hour
 */
export const publicRateLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authenticated rate limiter — 1000 requests per hour per user
 */
export const authenticatedRateLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req as Request & { user?: { id: string } }).user?.id ?? ipKeyGenerator(req.ip ?? '0.0.0.0'),
});

/**
 * Auth rate limiter — 10 requests per hour (login/signup)
 */
export const authRateLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

/**
 * Upload rate limiter — 100 requests per hour per user/IP
 */
export const uploadRateLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many upload requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req as Request & { user?: { id: string } }).user?.id ?? ipKeyGenerator(req.ip ?? '0.0.0.0'),
});

/**
 * API rate limiter — 500 requests per hour
 */
export const apiRateLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 500,
  message: { success: false, error: 'Too many API requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => (req as Request & { user?: { id: string } }).user?.id ?? ipKeyGenerator(req.ip ?? '0.0.0.0'),
});

/**
 * Webhook inbound rate limiter — 60 requests per minute per IP
 */
export const webhookInboundLimiter = makeRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many webhook requests.' },
});

/**
 * Deletion rate limiter — 20 delete requests per minute per user/IP
 */
export const deletionLimiter = makeRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many delete requests. Please slow down.' },
});

/**
 * Rate limiting tiers for easy access
 */
export const rateLimitTiers = {
  public: publicRateLimiter,
  authenticated: authenticatedRateLimiter,
  auth: authRateLimiter,
  upload: uploadRateLimiter,
  api: apiRateLimiter,
};

export default rateLimitTiers;
