import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'audit-id-001') }));
vi.mock('@/lib/dynamo', () => ({
  AuditLogEntity: {
    create: vi.fn(),
  },
}));
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

import { createAuditLog } from './audit';
import { auth } from '@/auth';
import { AuditLogEntity } from '@/lib/dynamo';
import { headers } from 'next/headers';

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockCreate = AuditLogEntity.create as ReturnType<typeof vi.fn>;
const mockHeaders = headers as ReturnType<typeof vi.fn>;

function authed(userId = 'user-1') {
  mockAuth.mockResolvedValue({ user: { id: userId } });
}

function notAuthed() {
  mockAuth.mockResolvedValue(null);
}

function makeHeadersList(values: Record<string, string | null> = {}) {
  return {
    get: vi.fn((key: string) => values[key] ?? null),
  };
}

describe('createAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(makeHeadersList());
    mockCreate.mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
  });

  it('[P0] writes audit log entry when session is valid', async () => {
    authed('user-abc');

    await createAuditLog({ action: 'FORM_SUBMIT', resource: 'Form' });

    expect(mockCreate).toHaveBeenCalledOnce();
    const arg = mockCreate.mock.calls[0][0];
    expect(arg.userId).toBe('user-abc');
    expect(arg.action).toBe('FORM_SUBMIT');
    expect(arg.entityType).toBe('Form');
  });

  it('[P0] skips writing when there is no session', async () => {
    notAuthed();

    await createAuditLog({ action: 'FORM_SUBMIT', resource: 'Form' });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('[P0] defaults projectId to "GLOBAL" when not provided', async () => {
    authed();
    await createAuditLog({ action: 'TEST', resource: 'Foo' });

    const arg = mockCreate.mock.calls[0][0];
    expect(arg.projectId).toBe('GLOBAL');
  });

  it('[P0] uses the provided projectId when given', async () => {
    authed();
    await createAuditLog({ action: 'TEST', resource: 'Foo', projectId: 'proj-123' });

    const arg = mockCreate.mock.calls[0][0];
    expect(arg.projectId).toBe('proj-123');
  });

  it('[P0] JSON-stringifies details when provided', async () => {
    authed();
    const details = { key: 'value', count: 42 } as Parameters<typeof createAuditLog>[0]['details'];
    await createAuditLog({ action: 'TEST', resource: 'Foo', details });

    const arg = mockCreate.mock.calls[0][0];
    expect(typeof arg.details).toBe('string');
    expect(JSON.parse(arg.details)).toEqual({ key: 'value', count: 42 });
  });

  it('[P0] details is undefined when not provided', async () => {
    authed();
    await createAuditLog({ action: 'TEST', resource: 'Foo' });

    const arg = mockCreate.mock.calls[0][0];
    expect(arg.details).toBeUndefined();
  });

  it('[P1] extracts first IP from X-Forwarded-For chain', async () => {
    authed();
    mockHeaders.mockResolvedValue(
      makeHeadersList({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.0.1.2' })
    );

    await createAuditLog({ action: 'TEST', resource: 'Foo' });

    const arg = mockCreate.mock.calls[0][0];
    expect(arg.ipAddress).toBe('1.2.3.4');
  });

  it('[P1] falls back to X-Real-IP when X-Forwarded-For is absent', async () => {
    authed();
    mockHeaders.mockResolvedValue(makeHeadersList({ 'x-real-ip': '10.0.0.1' }));

    await createAuditLog({ action: 'TEST', resource: 'Foo' });

    const arg = mockCreate.mock.calls[0][0];
    expect(arg.ipAddress).toBe('10.0.0.1');
  });

  it('[P1] ipAddress is undefined when no IP headers present', async () => {
    authed();
    mockHeaders.mockResolvedValue(makeHeadersList({}));

    await createAuditLog({ action: 'TEST', resource: 'Foo' });

    const arg = mockCreate.mock.calls[0][0];
    expect(arg.ipAddress).toBeUndefined();
  });

  it('[P1] does not throw when DynamoDB create rejects', async () => {
    authed();
    mockCreate.mockReturnValue({ go: vi.fn().mockRejectedValue(new Error('DB error')) });

    await expect(createAuditLog({ action: 'TEST', resource: 'Foo' })).resolves.toBeUndefined();
  });

  it('[P1] uses nanoid for auditId', async () => {
    authed();
    await createAuditLog({ action: 'TEST', resource: 'Foo' });

    const arg = mockCreate.mock.calls[0][0];
    expect(arg.auditId).toBe('audit-id-001');
  });
});
