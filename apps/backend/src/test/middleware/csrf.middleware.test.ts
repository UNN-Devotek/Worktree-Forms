import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { csrfMiddleware } from '../../middleware/csrf.middleware.js';

function makeReq(overrides: {
  method?: string;
  headers?: Record<string, string | undefined>;
} = {}) {
  return {
    method: overrides.method ?? 'POST',
    headers: overrides.headers ?? {},
  };
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('csrfMiddleware', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.ALLOWED_ORIGINS = originalEnv.ALLOWED_ORIGINS;
  });

  // ─── Safe methods — always pass through ───────────────────────────────────

  it('[P0] GET — always passes through regardless of origin', () => {
    const req = makeReq({ method: 'GET', headers: { origin: 'https://evil.com' } });
    const res = makeRes();
    const next = vi.fn();

    csrfMiddleware(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('[P0] HEAD — passes through', () => {
    const req = makeReq({ method: 'HEAD' });
    const res = makeRes();
    const next = vi.fn();

    csrfMiddleware(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('[P0] OPTIONS — passes through', () => {
    const req = makeReq({ method: 'OPTIONS' });
    const res = makeRes();
    const next = vi.fn();

    csrfMiddleware(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  // ─── No origin/referer — allow (server-to-server) ────────────────────────

  it('[P0] POST with no origin and no referer — allows server-to-server calls', () => {
    const req = makeReq({ method: 'POST', headers: {} });
    const res = makeRes();
    const next = vi.fn();

    csrfMiddleware(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  // ─── Development mode with no ALLOWED_ORIGINS ────────────────────────────

  it('[P0] development with no ALLOWED_ORIGINS — skips check and passes through', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOWED_ORIGINS;

    const req = makeReq({ method: 'POST', headers: { origin: 'http://localhost:3005' } });
    const res = makeRes();
    const next = vi.fn();

    csrfMiddleware(req as any, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  // ─── Production with ALLOWED_ORIGINS ─────────────────────────────────────

  describe('production with ALLOWED_ORIGINS configured', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://worktree.pro,https://app.worktree.pro';
    });

    it('[P0] allowed origin — passes through', () => {
      const req = makeReq({ method: 'POST', headers: { origin: 'https://worktree.pro' } });
      const res = makeRes();
      const next = vi.fn();

      csrfMiddleware(req as any, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('[P0] second allowed origin — passes through', () => {
      const req = makeReq({ method: 'POST', headers: { origin: 'https://app.worktree.pro' } });
      const res = makeRes();
      const next = vi.fn();

      csrfMiddleware(req as any, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('[P0] disallowed origin — returns 403', () => {
      const req = makeReq({ method: 'POST', headers: { origin: 'https://evil.com' } });
      const res = makeRes();
      const next = vi.fn();

      csrfMiddleware(req as any, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
      expect(next).not.toHaveBeenCalled();
    });

    it('[P0] PUT with disallowed origin — also blocked', () => {
      const req = makeReq({ method: 'PUT', headers: { origin: 'https://attacker.com' } });
      const res = makeRes();
      const next = vi.fn();

      csrfMiddleware(req as any, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('[P0] DELETE with disallowed origin — blocked', () => {
      const req = makeReq({ method: 'DELETE', headers: { origin: 'https://attacker.com' } });
      const res = makeRes();
      const next = vi.fn();

      csrfMiddleware(req as any, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    // ─── Referer fallback ────────────────────────────────────────────────────

    it('[P1] no origin but allowed referer — passes through', () => {
      const req = makeReq({
        method: 'POST',
        headers: { referer: 'https://worktree.pro/dashboard' },
      });
      const res = makeRes();
      const next = vi.fn();

      csrfMiddleware(req as any, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it('[P1] no origin but disallowed referer — returns 403', () => {
      const req = makeReq({
        method: 'POST',
        headers: { referer: 'https://evil.com/steal' },
      });
      const res = makeRes();
      const next = vi.fn();

      csrfMiddleware(req as any, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('[P1] malformed referer URL — returns 403', () => {
      const req = makeReq({
        method: 'POST',
        headers: { referer: 'not-a-valid-url' },
      });
      const res = makeRes();
      const next = vi.fn();

      csrfMiddleware(req as any, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('[P1] origin header takes precedence over referer', () => {
      // origin is allowed — should pass even if referer would fail
      const req = makeReq({
        method: 'POST',
        headers: {
          origin: 'https://worktree.pro',
          referer: 'https://evil.com/steal',
        },
      });
      const res = makeRes();
      const next = vi.fn();

      csrfMiddleware(req as any, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });
});
