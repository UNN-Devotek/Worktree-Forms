import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nanoid', () => ({ nanoid: vi.fn().mockReturnValue('sub-nanoid-001') }));

vi.mock('../../lib/dynamo/index.js', () => ({
  FormEntity: {
    get: vi.fn(),
  },
  SubmissionEntity: {
    create: vi.fn(),
  },
}));

import { BulkImportService } from '../../services/import.service.js';
import { FormEntity, SubmissionEntity } from '../../lib/dynamo/index.js';

const mockForm = FormEntity as { get: ReturnType<typeof vi.fn> };
const mockSubmission = SubmissionEntity as { create: ReturnType<typeof vi.fn> };

describe('BulkImportService', () => {
  let service: BulkImportService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BulkImportService();
  });

  describe('importSubmissions', () => {
    it('[P0] throws when form is not found', async () => {
      mockForm.get.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: null }) });

      await expect(
        service.importSubmissions('form-x', 'proj-1', [{ name: 'Alice' }])
      ).rejects.toThrow('Form not found');

      expect(mockSubmission.create).not.toHaveBeenCalled();
    });

    it('[P0] creates one submission per row and returns correct count', async () => {
      mockForm.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { formId: 'f1', projectId: 'proj-1' } }),
      });
      mockSubmission.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      const rows = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }];
      const result = await service.importSubmissions('f1', 'proj-1', rows);

      expect(result.count).toBe(3);
      expect(mockSubmission.create).toHaveBeenCalledTimes(3);
    });

    it('[P0] each submission gets PENDING status and correct formId/projectId', async () => {
      mockForm.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { formId: 'f1' } }),
      });
      mockSubmission.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await service.importSubmissions('f1', 'proj-1', [{ score: 42 }]);

      const arg = mockSubmission.create.mock.calls[0][0];
      expect(arg.formId).toBe('f1');
      expect(arg.projectId).toBe('proj-1');
      expect(arg.status).toBe('PENDING');
      expect(arg.data).toEqual({ score: 42 });
    });

    it('[P1] returns count of 0 for empty data array', async () => {
      mockForm.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { formId: 'f1' } }),
      });

      const result = await service.importSubmissions('f1', 'proj-1', []);
      expect(result.count).toBe(0);
      expect(mockSubmission.create).not.toHaveBeenCalled();
    });

    it('[P1] each submission gets a unique submissionId from nanoid', async () => {
      const nanoidMock = await import('nanoid');
      let callCount = 0;
      vi.mocked(nanoidMock.nanoid).mockImplementation(() => `id-${++callCount}`);

      mockForm.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { formId: 'f1' } }),
      });
      mockSubmission.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await service.importSubmissions('f1', 'proj-1', [{ a: 1 }, { a: 2 }]);

      const ids = mockSubmission.create.mock.calls.map((c) => c[0].submissionId);
      expect(ids[0]).not.toBe(ids[1]);
    });

    it('[P1] validates form using the correct projectId and formId', async () => {
      mockForm.get.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: { formId: 'form-abc' } }),
      });
      mockSubmission.create.mockReturnValue({ go: vi.fn().mockResolvedValue({ data: {} }) });

      await service.importSubmissions('form-abc', 'proj-xyz', [{ x: 1 }]);

      expect(mockForm.get).toHaveBeenCalledWith({ projectId: 'proj-xyz', formId: 'form-abc' });
    });
  });
});
