import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; systemRole: string };
}

/**
 * Parse a specific cookie value from the raw Cookie header.
 * cookie-parser is not installed; this avoids adding a dependency.
 */
function parseCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.slice(name.length + 1));
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Try Authorization header first (API / webhook clients)
  let token: string | undefined;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    token = header.slice(7);
  } else {
    // Fall back to httpOnly cookie (browser clients)
    token = parseCookieValue(req.headers.cookie, 'access_token');
  }

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return res.status(500).json({ success: false, error: 'Server misconfiguration' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string; email: string; systemRole: string;
    };
    (req as AuthenticatedRequest).user = {
      id: payload.sub,
      email: payload.email,
      systemRole: payload.systemRole ?? 'MEMBER',
    };
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

/** Same as authenticate but skips (does not reject) if no token provided */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const cookieToken = parseCookieValue(req.headers.cookie, 'access_token');
  if (header?.startsWith('Bearer ') || cookieToken) {
    return authenticate(req, res, next);
  }
  next();
}
