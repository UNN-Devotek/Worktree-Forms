import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticate, optionalAuth } from '../../middleware/authenticate.js';

const SECRET = 'test-secret-32-chars-long-enough!!';

function makeToken(payload: Record<string, unknown> = {}) {
  return jwt.sign(
    { sub: 'user-123', email: 'user@example.com', systemRole: 'MEMBER', ...payload },
    SECRET,
    { algorithm: 'HS256' }
  );
}

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    headers: {},
    ...overrides,
  };
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('authenticate', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  // --- missing token ---

  it('[P0] returns 401 when no Authorization header and no cookie', () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    const next = vi.fn();

    authenticate(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  // --- Bearer token ---

  it('[P0] accepts valid Bearer token and calls next()', () => {
    const token = makeToken();
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = vi.fn();

    authenticate(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as any).user.id).toBe('user-123');
    expect((req as any).user.email).toBe('user@example.com');
    expect((req as any).user.systemRole).toBe('MEMBER');
  });

  it('[P0] returns 401 for invalid Bearer token', () => {
    const req = makeReq({ headers: { authorization: 'Bearer totally.fake.token' } });
    const res = makeRes();
    const next = vi.fn();

    authenticate(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('[P0] returns 401 for expired token', () => {
    const token = jwt.sign(
      { sub: 'u1', email: 'u@x.com', systemRole: 'MEMBER' },
      SECRET,
      { algorithm: 'HS256', expiresIn: -1 }
    );
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = vi.fn();

    authenticate(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('[P0] returns 401 for token signed with wrong secret', () => {
    const token = jwt.sign({ sub: 'u1', email: 'u@x.com', systemRole: 'MEMBER' }, 'wrong-secret');
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = vi.fn();

    authenticate(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // --- Cookie fallback ---

  it('[P0] accepts valid token from access_token cookie', () => {
    const token = makeToken();
    const req = makeReq({ headers: { cookie: `access_token=${encodeURIComponent(token)}` } });
    const res = makeRes();
    const next = vi.fn();

    authenticate(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as any).user.id).toBe('user-123');
  });

  it('[P1] cookie with other cookies present still parses access_token', () => {
    const token = makeToken();
    const req = makeReq({
      headers: { cookie: `session=abc; access_token=${encodeURIComponent(token)}; other=xyz` },
    });
    const res = makeRes();
    const next = vi.fn();

    authenticate(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('[P1] Bearer header takes precedence over cookie', () => {
    const goodToken = makeToken({ sub: 'bearer-user' });
    const cookieToken = makeToken({ sub: 'cookie-user' });
    const req = makeReq({
      headers: {
        authorization: `Bearer ${goodToken}`,
        cookie: `access_token=${encodeURIComponent(cookieToken)}`,
      },
    });
    const res = makeRes();
    const next = vi.fn();

    authenticate(req as any, res, next);

    expect((req as any).user.id).toBe('bearer-user');
  });

  // --- missing JWT_SECRET ---

  it('[P0] returns 500 if JWT_SECRET is not set', () => {
    delete process.env.JWT_SECRET;
    const token = makeToken();
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = vi.fn();

    authenticate(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });

  // --- systemRole default ---

  it('[P1] systemRole defaults to MEMBER when absent from payload', () => {
    const token = jwt.sign({ sub: 'u1', email: 'u@x.com' }, SECRET, { algorithm: 'HS256' });
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = vi.fn();

    authenticate(req as any, res, next);

    expect((req as any).user.systemRole).toBe('MEMBER');
  });
});

// ---------------------------------------------------------------------------
// optionalAuth
// ---------------------------------------------------------------------------

describe('optionalAuth', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('[P0] calls next() immediately when no token is provided', () => {
    const req = makeReq({ headers: {} });
    const res = makeRes();
    const next = vi.fn();

    optionalAuth(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('[P0] authenticates and populates req.user when valid Bearer token is present', () => {
    const token = makeToken();
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = vi.fn();

    optionalAuth(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as any).user.id).toBe('user-123');
  });

  it('[P0] rejects (401) when an invalid Bearer token is present', () => {
    const req = makeReq({ headers: { authorization: 'Bearer bad.token.here' } });
    const res = makeRes();
    const next = vi.fn();

    optionalAuth(req as any, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('[P1] passes through when no cookie and no header — user not populated', () => {
    const req = makeReq({ headers: { cookie: 'session=other' } });
    const res = makeRes();
    const next = vi.fn();

    optionalAuth(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((req as any).user).toBeUndefined();
  });
});
