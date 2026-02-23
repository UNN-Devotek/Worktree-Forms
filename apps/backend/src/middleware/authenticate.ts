import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; systemRole: string };
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const token = header.slice(7);
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
  if (header?.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
}
