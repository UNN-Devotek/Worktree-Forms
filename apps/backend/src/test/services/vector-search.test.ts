import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Pinecone SDK before any imports that use it
const mockUpsert = vi.fn().mockResolvedValue(undefined);
const mockQuery = vi.fn();
const mockDeleteMany = vi.fn().mockResolvedValue(undefined);
const mockIndex = vi.fn().mockReturnValue({
  upsert: mockUpsert,
  query: mockQuery,
  deleteMany: mockDeleteMany,
});

vi.mock('@pinecone-database/pinecone', () => ({
  Pinecone: vi.fn().mockImplementation(() => ({ index: mockIndex })),
}));

// Set required env vars before module import
process.env.PINECONE_API_KEY = 'test-key';
process.env.PINECONE_INDEX_NAME = 'test-index';
delete process.env.PINECONE_HOST;

import {
  upsertVector,
  queryVectors,
  deleteVectors,
  deleteProjectVectors,
} from '../../services/vector-search.js';

describe('vector-search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIndex.mockReturnValue({
      upsert: mockUpsert,
      query: mockQuery,
      deleteMany: mockDeleteMany,
    });
  });

  // ─── upsertVector ──────────────────────────────────────────────────────────

  describe('upsertVector', () => {
    it('[P0] calls index.upsert with correct record shape', async () => {
      mockUpsert.mockResolvedValue(undefined);

      const vector = [0.1, 0.2, 0.3];
      const metadata = {
        projectId: 'proj-1',
        submissionId: 'sub-1',
        formId: 'form-1',
        entityType: 'submission',
        text: 'sample text',
      };

      await upsertVector('vec-id-1', vector, metadata);

      expect(mockUpsert).toHaveBeenCalledWith({
        records: [{ id: 'vec-id-1', values: vector, metadata }],
      });
    });

    it('[P1] wraps the single record in a records array (not bare object)', async () => {
      mockUpsert.mockResolvedValue(undefined);

      await upsertVector('id-x', [1, 2], {
        projectId: 'p',
        submissionId: 's',
        formId: 'f',
        entityType: 'e',
        text: 't',
      });

      const arg = mockUpsert.mock.calls[0][0];
      expect(Array.isArray(arg.records)).toBe(true);
      expect(arg.records).toHaveLength(1);
    });
  });

  // ─── queryVectors ──────────────────────────────────────────────────────────

  describe('queryVectors', () => {
    it('[P0] returns mapped results with id, score, and metadata', async () => {
      mockQuery.mockResolvedValue({
        matches: [
          { id: 'v1', score: 0.95, metadata: { projectId: 'proj-1', submissionId: 's1', formId: 'f1', entityType: 'submission', text: 'hello' } },
          { id: 'v2', score: 0.80, metadata: { projectId: 'proj-1', submissionId: 's2', formId: 'f1', entityType: 'submission', text: 'world' } },
        ],
      });

      const results = await queryVectors([0.1, 0.2], 'proj-1', 5);

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('v1');
      expect(results[0].score).toBe(0.95);
      expect(results[0].metadata.submissionId).toBe('s1');
    });

    it('[P0] passes projectId as metadata filter', async () => {
      mockQuery.mockResolvedValue({ matches: [] });

      await queryVectors([0.5], 'proj-abc', 3);

      const arg = mockQuery.mock.calls[0][0];
      expect(arg.filter).toEqual({ projectId: { $eq: 'proj-abc' } });
    });

    it('[P0] uses provided topK value', async () => {
      mockQuery.mockResolvedValue({ matches: [] });

      await queryVectors([0.1], 'proj-1', 10);

      expect(mockQuery.mock.calls[0][0].topK).toBe(10);
    });

    it('[P0] defaults topK to 5 when not provided', async () => {
      mockQuery.mockResolvedValue({ matches: [] });

      await queryVectors([0.1], 'proj-1');

      expect(mockQuery.mock.calls[0][0].topK).toBe(5);
    });

    it('[P1] defaults score to 0 when match score is undefined', async () => {
      mockQuery.mockResolvedValue({
        matches: [{ id: 'v1', score: undefined, metadata: {} }],
      });

      const results = await queryVectors([0.1], 'proj-1');
      expect(results[0].score).toBe(0);
    });

    it('[P1] passes includeMetadata: true', async () => {
      mockQuery.mockResolvedValue({ matches: [] });

      await queryVectors([0.1], 'proj-1');

      expect(mockQuery.mock.calls[0][0].includeMetadata).toBe(true);
    });
  });

  // ─── deleteVectors ─────────────────────────────────────────────────────────

  describe('deleteVectors', () => {
    it('[P0] calls deleteMany with the provided ids array', async () => {
      mockDeleteMany.mockResolvedValue(undefined);

      await deleteVectors(['v1', 'v2', 'v3']);

      expect(mockDeleteMany).toHaveBeenCalledWith({ ids: ['v1', 'v2', 'v3'] });
    });

    it('[P0] returns early without calling deleteMany when ids array is empty', async () => {
      await deleteVectors([]);
      expect(mockDeleteMany).not.toHaveBeenCalled();
    });
  });

  // ─── deleteProjectVectors ──────────────────────────────────────────────────

  describe('deleteProjectVectors', () => {
    it('[P0] calls deleteMany with projectId metadata filter', async () => {
      mockDeleteMany.mockResolvedValue(undefined);

      await deleteProjectVectors('proj-xyz');

      expect(mockDeleteMany).toHaveBeenCalledWith({
        filter: { projectId: { $eq: 'proj-xyz' } },
      });
    });
  });
});
