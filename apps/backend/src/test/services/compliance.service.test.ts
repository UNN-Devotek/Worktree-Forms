import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nanoid', () => ({ nanoid: vi.fn(() => 'record-nanoid-001') }));

vi.mock('../../lib/dynamo/index.js', () => ({
  ComplianceRecordEntity: {
    create: vi.fn(),
    query: {
      byUser: vi.fn(),
    },
  },
}));

import { ComplianceService } from '../../services/compliance.service.js';
import { ComplianceRecordEntity } from '../../lib/dynamo/index.js';

const mockEntity = ComplianceRecordEntity as {
  create: ReturnType<typeof vi.fn>;
  query: { byUser: ReturnType<typeof vi.fn> };
};

describe('ComplianceService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('submitInsurance', () => {
    it('[P0] creates an INSURANCE record with VERIFIED status', async () => {
      const fakeRecord = { recordId: 'record-nanoid-001', type: 'INSURANCE', status: 'VERIFIED' };
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: fakeRecord }) });

      const result = await ComplianceService.submitInsurance(
        'user-1', 'proj-1', 'https://s3.example.com/insurance.pdf'
      );

      expect(mockEntity.create).toHaveBeenCalledOnce();
      const arg = mockEntity.create.mock.calls[0][0];
      expect(arg.type).toBe('INSURANCE');
      expect(arg.status).toBe('VERIFIED');
      expect(arg.userId).toBe('user-1');
      expect(arg.projectId).toBe('proj-1');
      expect(arg.data).toMatchObject({ insuranceUrl: 'https://s3.example.com/insurance.pdf' });
      expect(result).toEqual(fakeRecord);
    });

    it('[P1] recordId is generated via nanoid', async () => {
      mockEntity.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await ComplianceService.submitInsurance('u1', 'p1', 'https://example.com/doc.pdf');

      const arg = mockEntity.create.mock.calls[0][0];
      expect(arg.recordId).toBe('record-nanoid-001');
    });
  });

  describe('getStatus', () => {
    it('[P0] returns records matching the given projectId', async () => {
      const records = [
        { recordId: 'r1', userId: 'user-1', projectId: 'proj-1', type: 'INSURANCE' },
        { recordId: 'r2', userId: 'user-1', projectId: 'proj-2', type: 'INSURANCE' },
      ];
      mockEntity.query.byUser.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: records }) });

      const result = await ComplianceService.getStatus('user-1', 'proj-1');

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('proj-1');
    });

    it('[P0] returns empty array when no records match projectId', async () => {
      mockEntity.query.byUser.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      const result = await ComplianceService.getStatus('user-1', 'proj-99');
      expect(result).toHaveLength(0);
    });

    it('[P1] queries by userId', async () => {
      mockEntity.query.byUser.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: [] }) });

      await ComplianceService.getStatus('user-abc', 'proj-1');
      expect(mockEntity.query.byUser).toHaveBeenCalledWith({ userId: 'user-abc' });
    });
  });
});
