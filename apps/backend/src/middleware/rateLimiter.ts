import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Rate limiting configuration.
 * Uses Redis store when REDIS_URL is set (production / multi-instance),
 * falls back to in-memory store for local development.
 */

// Lazily initialise Redis store to avoid crashing when REDIS_URL is absent
async function buildStore() {
  if (!process.env.REDIS_URL) {
    return undefined; // Use in-memory (default)
  }
  try {
    const { createClient } = await import('redis');
    const { RedisStore } = await import('rate-limit-redis');
    const client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err: Error) => console.error('Redis rate-limit client error:', err.message));
    await client.connect();
    console.log('✓ Rate limiter connected to Redis');
    return new RedisStore({ sendCommand: (...args: string[]) => (client as any).sendCommand(args) });
  } catch (err) {
    console.warn('Rate limiter: failed to connect to Redis, falling back to in-memory store:', err instanceof Error ? err.message : err);
    return undefined;
  }
}

// Store singleton (undefined until first limiter is created)
let _store: unknown = undefined;
let _storeInitialized = false;

async function getStore() {
  if (!_storeInitialized) {
    _store = await buildStore();
    _storeInitialized = true;
  }
  return _store as any;
}

function makeRateLimiter(opts: Parameters<typeof rateLimit>[0]) {
  // store is set asynchronously after construction via setStore if needed
  const limiter = rateLimit(opts);
  // Attach store after it's ready (non-blocking; requests during init use in-memory)
  getStore().then(store => {
    if (store) {
      (limiter as any).store = store;
    }
  }).catch(() => {/* already handled in getStore */});
  return limiter;
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
  keyGenerator: (req: Request) => (req as any).user?.id,
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
  keyGenerator: (req: Request) => (req as any).user?.id,
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
  keyGenerator: (req: Request) => (req as any).user?.id,
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
