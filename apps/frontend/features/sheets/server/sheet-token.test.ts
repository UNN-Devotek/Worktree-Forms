import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set JWT_SECRET before sheet-actions.ts is imported — it has a module-level guard
vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long!!';
});

vi.mock('@/lib/dynamo', () => ({
  ProjectEntity: {
    query: {
      bySlug: vi.fn(() => ({ go: vi.fn() })),
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
  },
  ProjectMemberEntity: {
    query: {
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
  },
  SheetEntity: {
    query: {
      primary: vi.fn(() => ({ go: vi.fn() })),
    },
    create: vi.fn(() => ({ go: vi.fn() })),
  },
  SheetColumnEntity: {
    create: vi.fn(() => ({ go: vi.fn() })),
    query: {
      bySheet: vi.fn(() => ({ go: vi.fn() })),
    },
  },
  SheetRowEntity: {
    query: {
      bySheet: vi.fn(() => ({ go: vi.fn() })),
    },
  },
  UserEntity: {
    get: vi.fn(() => ({ go: vi.fn() })),
  },
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-nanoid-id'),
}));

// Stub yjs to avoid browser-only issues in node test env
vi.mock('yjs', () => ({
  Doc: vi.fn().mockImplementation(() => ({
    getMap: vi.fn().mockReturnValue({ set: vi.fn() }),
    encodeStateAsUpdate: vi.fn(),
    transact: vi.fn(),
  })),
}));

import { getSheetToken } from './sheet-actions';
import { auth } from '@/auth';
import { SheetEntity, ProjectMemberEntity } from '@/lib/dynamo';

const mockAuth = auth as ReturnType<typeof vi.fn>;

describe('getSheetToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('[P0] returns null when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const token = await getSheetToken('sheet-1', 'proj-1');
    expect(token).toBeNull();
  });

  it('[P0] returns null when sheet does not exist in project', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Alice' } });

    (SheetEntity.query.primary as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [] }),
    });

    const token = await getSheetToken('bad-sheet', 'proj-1');
    expect(token).toBeNull();
  });

  it('[P0] returns null when user is not a project member', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Alice' } });

    (SheetEntity.query.primary as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ sheetId: 'sheet-1' }] }),
    });

    (ProjectMemberEntity.query.primary as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [] }),
    });

    const token = await getSheetToken('sheet-1', 'proj-1');
    expect(token).toBeNull();
  });

  it('[P0] returns a signed JWT when user is a valid project member', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Alice' } });

    (SheetEntity.query.primary as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ sheetId: 'sheet-1', projectId: 'proj-1' }] }),
    });

    (ProjectMemberEntity.query.primary as ReturnType<typeof vi.fn>).mockReturnValue({
      go: vi.fn().mockResolvedValue({ data: [{ userId: 'user-1', roles: ['EDITOR'] }] }),
    });

    const token = await getSheetToken('sheet-1', 'proj-1');

    expect(typeof token).toBe('string');
    expect(token!.split('.').length).toBe(3); // valid JWT format

    // Decode payload (base64) to verify claims
    const payload = JSON.parse(Buffer.from(token!.split('.')[1], 'base64url').toString());
    expect(payload.userId).toBe('user-1');
    expect(payload.sheetId).toBe('sheet-1');
  });
});
