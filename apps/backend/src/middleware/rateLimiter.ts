import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Rate limiting configuration following Squidhub pattern
 * Uses sliding window algorithm with memory store
 *
 * TODO: For production with multiple instances, integrate Redis:
 * import RedisStore from 'rate-limit-redis';
 * import { createClient } from 'redis';
 */

/**
 * Public rate limiter - For unauthenticated requests
 * 100 requests per hour
 */
export const publicRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
  // Use IP address for rate limiting
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

/**
 * Authenticated rate limiter - For logged-in users
 * 1000 requests per hour per user
 */
export const authenticatedRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID if available, fallback to IP
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId || req.ip || req.socket.remoteAddress || 'unknown';
  }
});

/**
 * Auth rate limiter - For authentication endpoints (login, signup)
 * Very strict: 10 requests per hour
 * Skip successful requests to avoid penalizing successful logins
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

/**
 * Upload rate limiter - For file upload endpoints
 * 100 requests per hour per user/IP
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: {
    success: false,
    error: 'Too many upload requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId || req.ip || req.socket.remoteAddress || 'unknown';
  }
});

/**
 * API rate limiter - General API protection
 * 500 requests per hour
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  message: {
    success: false,
    error: 'Too many API requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId || req.ip || req.socket.remoteAddress || 'unknown';
  }
});

/**
 * Rate limiting tiers for easy access
 */
export const rateLimitTiers = {
  public: publicRateLimiter,
  authenticated: authenticatedRateLimiter,
  auth: authRateLimiter,
  upload: uploadRateLimiter,
  api: apiRateLimiter
};

// Export individual rate limiters for convenience
export default rateLimitTiers;
