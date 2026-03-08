import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DynamoDB dependency before importing middleware
vi.mock('../../lib/dynamo/index.js', () => ({
  ProjectMemberEntity: {
    query: {
      primary: vi.fn(),
    },
  },
}));

import { hasRole, requireProjectAccess } from '../../middleware/rbac.js';
import { ProjectMemberEntity } from '../../lib/dynamo/index.js';

const mockQuery = ProjectMemberEntity.query as {
  primary: ReturnType<typeof vi.fn>;
};

// Minimal Express mock helpers
function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    params: {},
    body: {},
    query: {},
    user: { id: 'user-001' },
    ...overrides,
  };
}

function makeRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json, _json: json };
}

describe('hasRole()', () => {
  it('[P0] VIEWER satisfies VIEWER requirement', () => {
    expect(hasRole(['VIEWER'], 'VIEWER')).toBe(true);
  });

  it('[P0] OWNER satisfies all roles', () => {
    expect(hasRole(['OWNER'], 'VIEWER')).toBe(true);
    expect(hasRole(['OWNER'], 'EDITOR')).toBe(true);
    expect(hasRole(['OWNER'], 'ADMIN')).toBe(true);
    expect(hasRole(['OWNER'], 'OWNER')).toBe(true);
  });

  it('[P0] VIEWER does not satisfy EDITOR requirement', () => {
    expect(hasRole(['VIEWER'], 'EDITOR')).toBe(false);
  });

  it('[P0] EDITOR does not satisfy ADMIN requirement', () => {
    expect(hasRole(['EDITOR'], 'ADMIN')).toBe(false);
  });

  it('[P0] empty roles array always returns false', () => {
    expect(hasRole([], 'VIEWER')).toBe(false);
  });

  it('[P1] multiple roles — highest role wins', () => {
    expect(hasRole(['VIEWER', 'EDITOR'], 'EDITOR')).toBe(true);
    expect(hasRole(['VIEWER', 'ADMIN'], 'ADMIN')).toBe(true);
  });

  it('[P1] unknown role string is treated as insufficient', () => {
    expect(hasRole(['SUPERUSER'], 'VIEWER')).toBe(false);
  });
});

describe('requireProjectAccess middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[P0] returns 401 when no userId on request', async () => {
    const req = makeReq({ user: undefined, params: { projectId: 'proj-1' } });
    const res = makeRes();
    const next = vi.fn();

    await requireProjectAccess('VIEWER')(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('[P0] returns 400 when projectId is missing', async () => {
    const req = makeReq({ user: { id: 'user-001' }, params: {}, query: {}, body: {} });
    const res = makeRes();
    const next = vi.fn();

    await requireProjectAccess('VIEWER')(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('[P0] returns 403 when user is not a project member', async () => {
    mockQuery.primary.mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [] }),
    });

    const req = makeReq({ params: { projectId: 'proj-1' } });
    const res = makeRes();
    const next = vi.fn();

    await requireProjectAccess('VIEWER')(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('[P0] returns 403 when role is insufficient', async () => {
    mockQuery.primary.mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ roles: ['VIEWER'] }] }),
    });

    const req = makeReq({ params: { projectId: 'proj-1' } });
    const res = makeRes();
    const next = vi.fn();

    await requireProjectAccess('ADMIN')(req as never, res as never, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('[P0] calls next() when user has sufficient role', async () => {
    mockQuery.primary.mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ roles: ['ADMIN'] }] }),
    });

    const req = makeReq({ params: { projectId: 'proj-1' } });
    const res = makeRes();
    const next = vi.fn();

    await requireProjectAccess('EDITOR')(req as never, res as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('[P1] projectId extracted from query string when not in params', async () => {
    mockQuery.primary.mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ roles: ['VIEWER'] }] }),
    });

    const req = makeReq({ params: {}, query: { projectId: 'proj-from-query' } });
    const res = makeRes();
    const next = vi.fn();

    await requireProjectAccess('VIEWER')(req as never, res as never, next);

    expect(mockQuery.primary).toHaveBeenCalledWith({
      projectId: 'proj-from-query',
      userId: 'user-001',
    });
    expect(next).toHaveBeenCalled();
  });

  it('[P1] projectId extracted from request body when not in params/query', async () => {
    mockQuery.primary.mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ roles: ['EDITOR'] }] }),
    });

    const req = makeReq({ params: {}, query: {}, body: { projectId: 'proj-from-body' } });
    const res = makeRes();
    const next = vi.fn();

    await requireProjectAccess('VIEWER')(req as never, res as never, next);

    expect(mockQuery.primary).toHaveBeenCalledWith({
      projectId: 'proj-from-body',
      userId: 'user-001',
    });
    expect(next).toHaveBeenCalled();
  });
});
