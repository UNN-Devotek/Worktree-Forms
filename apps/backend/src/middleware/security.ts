import helmet from 'helmet';

/**
 * Security headers middleware using Helmet
 * Implements comprehensive security headers following OWASP best practices
 */
export const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Tailwind/CSS-in-JS
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow data URIs, HTTPS images, and blobs
      connectSrc: ["'self'"], // API requests
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },

  // Prevent MIME type sniffing
  noSniff: true,

  // XSS Protection (legacy but still useful for older browsers)
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Frame Options - prevent clickjacking
  frameguard: {
    action: 'deny'
  }
});

/**
 * Relaxed security headers for development
 * Allows more permissive CSP for hot reloading and dev tools
 */
export const developmentSecurityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow eval for dev tools
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"], // Allow WebSocket for hot reload
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: false, // Disable HSTS in development
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  hidePoweredBy: true,
  frameguard: {
    action: 'deny'
  }
});

/**
 * Get appropriate security middleware based on environment
 */
export function getSecurityMiddleware() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    console.log('🔓 Using development security headers (relaxed CSP)');
    return developmentSecurityMiddleware;
  }

  console.log('🔒 Using production security headers (strict CSP)');
  return securityMiddleware;
}
