import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/dynamo/index.js', () => ({
  SubmissionEntity: {
    query: {
      byForm: vi.fn(),
    },
    patch: vi.fn(),
  },
}));

import { MigrationService } from '../../services/migration-service.js';
import { SubmissionEntity } from '../../lib/dynamo/index.js';

const mockSub = SubmissionEntity as {
  query: { byForm: ReturnType<typeof vi.fn> };
  patch: ReturnType<typeof vi.fn>;
};

// Helper to build a minimal schema with named fields
function makeSchema(fields: Array<{ id: string; name: string }>) {
  return {
    pages: [
      {
        sections: [
          {
            fields: fields.map((f) => ({ id: f.id, name: f.name })),
          },
        ],
      },
    ],
  };
}

describe('MigrationService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── detectRenames ─────────────────────────────────────────────────────────

  describe('detectRenames', () => {
    it('[P0] returns empty map when there are no fields', () => {
      const result = MigrationService.detectRenames({}, {});
      expect(result).toEqual({});
    });

    it('[P0] returns empty map when names are identical', () => {
      const schema = makeSchema([{ id: 'f1', name: 'First Name' }]);
      const result = MigrationService.detectRenames(schema, schema);
      expect(result).toEqual({});
    });

    it('[P0] detects a single field rename', () => {
      const old = makeSchema([{ id: 'f1', name: 'old_name' }]);
      const next = makeSchema([{ id: 'f1', name: 'new_name' }]);
      const result = MigrationService.detectRenames(old, next);
      expect(result).toEqual({ old_name: 'new_name' });
    });

    it('[P0] detects multiple renames simultaneously', () => {
      const old = makeSchema([
        { id: 'f1', name: 'first' },
        { id: 'f2', name: 'second' },
      ]);
      const next = makeSchema([
        { id: 'f1', name: 'firstName' },
        { id: 'f2', name: 'lastName' },
      ]);
      const result = MigrationService.detectRenames(old, next);
      expect(result).toEqual({ first: 'firstName', second: 'lastName' });
    });

    it('[P1] ignores fields removed in the new schema', () => {
      const old = makeSchema([
        { id: 'f1', name: 'keep' },
        { id: 'f2', name: 'removed' },
      ]);
      const next = makeSchema([{ id: 'f1', name: 'keep' }]);
      const result = MigrationService.detectRenames(old, next);
      expect(result).toEqual({});
    });

    it('[P1] handles null/non-object schemas gracefully', () => {
      expect(MigrationService.detectRenames(null, null)).toEqual({});
      expect(MigrationService.detectRenames('not-an-object', {})).toEqual({});
    });

    it('[P1] detects renames in nested columns', () => {
      const old = {
        pages: [
          {
            sections: [
              {
                fields: [
                  {
                    id: 'f1',
                    name: 'table',
                    columns: [{ id: 'col1', name: 'col_old' }],
                  },
                ],
              },
            ],
          },
        ],
      };
      const next = {
        pages: [
          {
            sections: [
              {
                fields: [
                  {
                    id: 'f1',
                    name: 'table',
                    columns: [{ id: 'col1', name: 'col_new' }],
                  },
                ],
              },
            ],
          },
        ],
      };
      const result = MigrationService.detectRenames(old, next);
      expect(result).toEqual({ col_old: 'col_new' });
    });
  });

  // ─── migrateSubmissions ────────────────────────────────────────────────────

  describe('migrateSubmissions', () => {
    it('[P0] skips DynamoDB entirely when renames is empty', async () => {
      await MigrationService.migrateSubmissions('form-1', 'proj-1', {});
      expect(mockSub.query.byForm).not.toHaveBeenCalled();
    });

    it('[P0] patches submission with renamed key', async () => {
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockSub.query.byForm.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            {
              submissionId: 'sub-1',
              data: { old_name: 'John', unchanged: 'value' },
            },
          ],
        }),
      });
      mockSub.patch.mockReturnValue({ set: mockSet });

      await MigrationService.migrateSubmissions('form-1', 'proj-1', { old_name: 'new_name' });

      expect(mockSub.patch).toHaveBeenCalledWith({ projectId: 'proj-1', submissionId: 'sub-1' });
      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.data).toHaveProperty('new_name', 'John');
      expect(setArg.data).not.toHaveProperty('old_name');
      expect(setArg.data.unchanged).toBe('value');
    });

    it('[P0] skips patching submissions that do not have the renamed key', async () => {
      mockSub.query.byForm.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ submissionId: 'sub-1', data: { other_field: 'val' } }],
        }),
      });

      await MigrationService.migrateSubmissions('form-1', 'proj-1', { old_name: 'new_name' });

      expect(mockSub.patch).not.toHaveBeenCalled();
    });

    it('[P0] patches multiple submissions independently', async () => {
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockSub.query.byForm.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { submissionId: 'sub-1', data: { old_key: 'a' } },
            { submissionId: 'sub-2', data: { old_key: 'b' } },
            { submissionId: 'sub-3', data: { unrelated: 'c' } }, // should be skipped
          ],
        }),
      });
      mockSub.patch.mockReturnValue({ set: mockSet });

      await MigrationService.migrateSubmissions('form-1', 'proj-1', { old_key: 'new_key' });

      expect(mockSub.patch).toHaveBeenCalledTimes(2);
    });

    it('[P1] applies multiple renames within a single submission', async () => {
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockSub.query.byForm.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [
            { submissionId: 'sub-1', data: { first: 'John', second: 'Doe' } },
          ],
        }),
      });
      mockSub.patch.mockReturnValue({ set: mockSet });

      await MigrationService.migrateSubmissions('form-1', 'proj-1', {
        first: 'firstName',
        second: 'lastName',
      });

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.data).toHaveProperty('firstName', 'John');
      expect(setArg.data).toHaveProperty('lastName', 'Doe');
      expect(setArg.data).not.toHaveProperty('first');
      expect(setArg.data).not.toHaveProperty('second');
    });

    it('[P1] sets updatedAt when patching', async () => {
      const mockSet = vi.fn().mockReturnValue({ go: vi.fn().mockResolvedValue({}) });
      mockSub.query.byForm.mockReturnValue({
        go: vi.fn().mockResolvedValue({
          data: [{ submissionId: 'sub-1', data: { old: 'val' } }],
        }),
      });
      mockSub.patch.mockReturnValue({ set: mockSet });

      await MigrationService.migrateSubmissions('form-1', 'proj-1', { old: 'new' });

      const setArg = mockSet.mock.calls[0][0];
      expect(setArg.updatedAt).toBeDefined();
      expect(typeof setArg.updatedAt).toBe('string');
    });

    it('[P1] queries by the correct formId', async () => {
      mockSub.query.byForm.mockReturnValue({
        go: vi.fn().mockResolvedValue({ data: [] }),
      });

      await MigrationService.migrateSubmissions('form-xyz', 'proj-1', { a: 'b' });

      expect(mockSub.query.byForm).toHaveBeenCalledWith({ formId: 'form-xyz' });
    });
  });
});
