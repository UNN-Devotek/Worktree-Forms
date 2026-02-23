import { Request, Response, NextFunction } from 'express';
import { runWithContext } from '../lib/async-context';

/**
 * Context middleware — propagates the current userId into Node.js AsyncLocalStorage
 * so it is available throughout the request's async call chain without threading
 * it through every function signature.
 *
 * This uses Node.js AsyncLocalStorage (async_hooks), NOT Postgres SET LOCAL.
 * There is no risk of context leaking between concurrent requests; each request
 * runs in its own async context slot. Any code that calls getAsyncContext() within
 * this request's async tree will see the correct userId.
 *
 * Reads userId from req.user (set by authenticate middleware). Must be mounted
 * AFTER authenticate middleware so req.user is already populated.
 */
export const contextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id ?? null;

  runWithContext({ userId }, () => {
    next();
  });
};
