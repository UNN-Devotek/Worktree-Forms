import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Must mock before importing contextMiddleware so runWithContext is intercepted
vi.mock('../../lib/async-context.js', () => ({
  runWithContext: vi.fn((ctx, fn) => fn()),
}));

import { contextMiddleware } from '../../middleware/context.middleware.js';
import { runWithContext } from '../../lib/async-context.js';

const mockRunWithContext = runWithContext as ReturnType<typeof vi.fn>;

function makeReq(userId?: string): Request {
  const req = {} as Request;
  if (userId !== undefined) {
    (req as Request & { user?: { id: string } }).user = { id: userId };
  }
  return req;
}

const res = {} as Response;

describe('contextMiddleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('[P0] calls next()', () => {
    const next = vi.fn() as NextFunction;
    contextMiddleware(makeReq('user-1'), res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('[P0] passes userId from req.user.id to runWithContext', () => {
    const next = vi.fn() as NextFunction;
    contextMiddleware(makeReq('user-abc'), res, next);
    expect(mockRunWithContext).toHaveBeenCalledWith({ userId: 'user-abc' }, expect.any(Function));
  });

  it('[P0] passes userId=null when req.user is absent', () => {
    const next = vi.fn() as NextFunction;
    contextMiddleware(makeReq(), res, next);
    expect(mockRunWithContext).toHaveBeenCalledWith({ userId: null }, expect.any(Function));
  });

  it('[P1] calls runWithContext exactly once per request', () => {
    const next = vi.fn() as NextFunction;
    contextMiddleware(makeReq('user-1'), res, next);
    expect(mockRunWithContext).toHaveBeenCalledTimes(1);
  });

  it('[P1] next() is called inside the runWithContext callback', () => {
    let callOrder: string[] = [];
    mockRunWithContext.mockImplementation((_ctx: unknown, fn: () => void) => {
      callOrder.push('context');
      fn();
      callOrder.push('after-fn');
    });
    const next = vi.fn(() => callOrder.push('next'));

    contextMiddleware(makeReq('user-1'), res, next as NextFunction);
    expect(callOrder).toEqual(['context', 'next', 'after-fn']);
  });
});
