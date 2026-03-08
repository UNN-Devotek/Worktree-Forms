import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'audit-id-001') }));

vi.mock('../../lib/dynamo/index.js', () => ({
  AuditLogEntity: {
    create: vi.fn(() => ({ go: vi.fn().mockResolvedValue({}) })),
  },
}));

import { auditMiddleware, auditSecurityEvent } from '../../middleware/audit.middleware.js';
import { AuditLogEntity } from '../../lib/dynamo/index.js';

const mockCreate = AuditLogEntity.create as ReturnType<typeof vi.fn>;

// Minimal req/res factory
function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    params: {},
    body: {},
    method: 'POST',
    path: '/test',
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    user: { id: 'user-001' },
    ...overrides,
  };
}

function makeRes(statusCode = 200) {
  const listeners: Record<string, (() => void)[]> = {};
  return {
    statusCode,
    on: vi.fn((event: string, cb: () => void) => {
      listeners[event] = listeners[event] ?? [];
      listeners[event].push(cb);
    }),
    emit: (event: string) => listeners[event]?.forEach((cb) => cb()),
  };
}

describe('auditMiddleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('[P0] calls next() immediately', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    auditMiddleware('form.create')(req as never, res as never, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('[P0] registers a finish listener on the response', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    auditMiddleware('form.create')(req as never, res as never, next);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('[P0] writes an audit log on 2xx response with correct action and userId', async () => {
    const req = makeReq({ user: { id: 'user-abc' } });
    const res = makeRes(201);
    const next = vi.fn();

    auditMiddleware('task.create')(req as never, res as never, next);
    res.emit('finish');

    await new Promise((r) => setTimeout(r, 10)); // let fire-and-forget settle

    expect(mockCreate).toHaveBeenCalledOnce();
    const arg = mockCreate.mock.calls[0][0];
    expect(arg.action).toBe('task.create');
    expect(arg.userId).toBe('user-abc');
    expect(arg.auditId).toBe('audit-id-001');
  });

  it('[P0] does NOT write audit log on 4xx response', async () => {
    const req = makeReq();
    const res = makeRes(400);
    const next = vi.fn();

    auditMiddleware('form.create')(req as never, res as never, next);
    res.emit('finish');
    await new Promise((r) => setTimeout(r, 10));

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('[P0] does NOT write audit log on 5xx response', async () => {
    const req = makeReq();
    const res = makeRes(500);
    const next = vi.fn();

    auditMiddleware('form.create')(req as never, res as never, next);
    res.emit('finish');
    await new Promise((r) => setTimeout(r, 10));

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('[P0] does NOT write audit log when userId is absent', async () => {
    const req = makeReq({ user: undefined });
    const res = makeRes(200);
    const next = vi.fn();

    auditMiddleware('form.create')(req as never, res as never, next);
    res.emit('finish');
    await new Promise((r) => setTimeout(r, 10));

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('[P1] extracts projectId from params when present', async () => {
    const req = makeReq({ params: { projectId: 'proj-from-param' } });
    const res = makeRes(200);
    const next = vi.fn();

    auditMiddleware('update')(req as never, res as never, next);
    res.emit('finish');
    await new Promise((r) => setTimeout(r, 10));

    const arg = mockCreate.mock.calls[0][0];
    expect(arg.projectId).toBe('proj-from-param');
  });

  it('[P1] falls back to "global" when no projectId is resolvable', async () => {
    const req = makeReq({ params: {}, body: {} });
    const res = makeRes(200);
    const next = vi.fn();

    auditMiddleware('update')(req as never, res as never, next);
    res.emit('finish');
    await new Promise((r) => setTimeout(r, 10));

    const arg = mockCreate.mock.calls[0][0];
    expect(arg.projectId).toBe('global');
  });

  it('[P1] sanitizes sensitive fields in the body before logging', async () => {
    const req = makeReq({
      body: { name: 'Alice', password: 'secret123', token: 'tok_abc', key: 'k1', data: 'ok' },
    });
    const res = makeRes(200);
    const next = vi.fn();

    auditMiddleware('user.update')(req as never, res as never, next);
    res.emit('finish');
    await new Promise((r) => setTimeout(r, 10));

    const arg = mockCreate.mock.calls[0][0];
    const body = arg.details.body as Record<string, string>;
    expect(body.name).toBe('Alice');
    expect(body.data).toBe('ok');
    expect(body.password).toBe('[REDACTED]');
    expect(body.token).toBe('[REDACTED]');
    expect(body.key).toBe('[REDACTED]');
  });
});

describe('auditSecurityEvent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('[P0] calls next() immediately', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn();

    auditSecurityEvent('resource.access')(req as never, res as never, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('[P0] writes security log on 401 response', async () => {
    const req = makeReq({ user: undefined });
    const res = makeRes(401);
    const next = vi.fn();

    auditSecurityEvent('admin.access')(req as never, res as never, next);
    res.emit('finish');
    await new Promise((r) => setTimeout(r, 10));

    expect(mockCreate).toHaveBeenCalledOnce();
    const arg = mockCreate.mock.calls[0][0];
    expect(arg.action).toBe('admin.access:401');
    expect(arg.userId).toBe('anonymous');
  });

  it('[P0] writes security log on 403 response', async () => {
    const req = makeReq({ user: { id: 'user-low-perm' } });
    const res = makeRes(403);
    const next = vi.fn();

    auditSecurityEvent('project.admin')(req as never, res as never, next);
    res.emit('finish');
    await new Promise((r) => setTimeout(r, 10));

    expect(mockCreate).toHaveBeenCalledOnce();
    const arg = mockCreate.mock.calls[0][0];
    expect(arg.action).toBe('project.admin:403');
    expect(arg.userId).toBe('user-low-perm');
  });

  it('[P0] does NOT write security log on 200 response', async () => {
    const req = makeReq();
    const res = makeRes(200);
    const next = vi.fn();

    auditSecurityEvent('resource')(req as never, res as never, next);
    res.emit('finish');
    await new Promise((r) => setTimeout(r, 10));

    expect(mockCreate).not.toHaveBeenCalled();
  });
});
